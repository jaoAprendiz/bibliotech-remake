import { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brand } from '../../components/Brand';
import { Button, ErrorText, Field, errorMessage } from '../../components/ui';
import { useLibrary } from '../../contexts/LibraryContext';
import { demoAccounts, demoPassword } from '../../data/library';

export const nameSchema = z.string().trim().min(3, 'Informe pelo menos três caracteres.');
const email = z.string().trim().email('Informe um e-mail válido.');
export const strongPassword = z.string().min(8, 'Use pelo menos oito caracteres.').regex(/[0-9]/, 'Inclua pelo menos um número.');
const schema = z.object({ name: z.string(), email: z.string(), password: z.string(), confirmation: z.string() });
type Values = z.infer<typeof schema>;
type Mode = 'login' | 'register' | 'recover' | 'reset';

const headings: Record<Mode, [string, string]> = {
  login: ['Bem-vindo de volta', 'Entre para acessar sua biblioteca.'],
  register: ['Crie sua conta', 'Cadastre-se para solicitar reservas no acervo.'],
  recover: ['Recuperar senha', 'Informe o e-mail da sua conta para iniciar a recuperação.'],
  reset: ['Redefinir senha', 'Escolha uma nova senha para sua conta.'],
};

export function Auth({ mode }: { mode: Mode }) {
  const { signIn, register: createAccount, resetPassword, notify } = useLibrary();
  const navigate = useNavigate();
  const location = useLocation();
  const [query] = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [recoveryLink, setRecoveryLink] = useState('');
  const validated = schema.superRefine((values, ctx) => {
    const validate = (key: keyof Values, rule: z.ZodType<string>) => {
      const parsed = rule.safeParse(values[key]);
      if (!parsed.success) ctx.addIssue({ code: 'custom', path: [key], message: parsed.error.issues[0].message });
    };
    if (mode !== 'reset') validate('email', email);
    if (mode === 'register') validate('name', nameSchema);
    if (mode === 'login') validate('password', z.string().min(1, 'Informe sua senha.'));
    if (mode === 'register' || mode === 'reset') {
      validate('password', strongPassword);
      if (values.password !== values.confirmation) ctx.addIssue({ code: 'custom', path: ['confirmation'], message: 'As senhas precisam ser iguais.' });
    }
  });
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(validated), defaultValues: { name: '', email: '', password: '', confirmation: '' },
  });
  const submit = (values: Values) => {
    setError('');
    try {
      if (mode === 'login') {
        const user = signIn(values.email, values.password);
        const base = user.role === 'admin' ? '/admin' : '/aluno';
        const from = (location.state as { from?: string } | null)?.from;
        navigate(from?.startsWith(base + '/') ? from : base, { replace: true });
      } else if (mode === 'register') {
        createAccount(values.name, values.email, values.password);
        notify('Sua conta foi criada.');
        navigate('/aluno', { replace: true });
      } else if (mode === 'recover') {
        const token = crypto.randomUUID();
        sessionStorage.setItem('bibliotech.recovery.' + token, JSON.stringify({ email: values.email.trim().toLowerCase(), expires: Date.now() + 900_000 }));
        setRecoveryLink('/redefinir-senha?token=' + token);
      } else {
        resetPassword(query.get('token') ?? '', values.password);
        notify('Fluxo de redefinição concluído.');
        navigate('/login', { replace: true });
      }
    } catch (cause) { setError(errorMessage(cause)); }
  };
  return <div className="auth-layout">
    <aside className="auth-art"><Brand /><img src="/library-art.svg" alt="" /><div><h2>O conhecimento<br />abre caminhos.</h2><p>Biblioteca escolar da ETEC Raposo Tavares</p></div></aside>
    <section className="auth-main">
      <Link className="text-link" to={mode === 'login' ? '/' : '/login'}><ArrowLeft size={17} />{mode === 'login' ? 'Voltar ao início' : 'Voltar para entrar'}</Link>
      {recoveryLink ? <div className="auth-form"><KeyRound /><h1>Próximo passo</h1><p>Em produção, uma conta elegível receberá um link por e-mail. Nesta demonstração, use o link local nesta aba em até 15 minutos.</p>
        <Link className="button" to={recoveryLink}>Abrir link de teste <ArrowRight size={16} /></Link></div> :
        <div className="auth-form"><h1>{headings[mode][0]}</h1><p>{headings[mode][1]}</p>
          <form onSubmit={handleSubmit(submit)} noValidate>
            {mode === 'register' && <Field label="Nome completo" error={errors.name?.message}><input autoComplete="name" aria-invalid={!!errors.name} {...register('name')} /></Field>}
            {mode !== 'reset' && <Field label="E-mail" error={errors.email?.message}><input type="email" autoComplete="email" placeholder="nome@exemplo.com" aria-invalid={!!errors.email} {...register('email')} /></Field>}
            {mode !== 'recover' && <><Field label="Senha" error={errors.password?.message}>
              <span className="password-input"><input type={visible ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} aria-invalid={!!errors.password} {...register('password')} />
                <button type="button" className="icon-button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
            </Field>{mode === 'login' ? <Link className="text-link forgot" to="/recuperar-senha">Esqueceu a senha?</Link> : <p className="hint">Pelo menos oito caracteres e um número.</p>}</>}
            {(mode === 'register' || mode === 'reset') && <Field label="Confirme a senha" error={errors.confirmation?.message}><input type={visible ? 'text' : 'password'} autoComplete="new-password" aria-invalid={!!errors.confirmation} {...register('confirmation')} /></Field>}
            <ErrorText message={error} />
            <Button type="submit">{mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : mode === 'recover' ? 'Continuar' : 'Salvar nova senha'} <ArrowRight size={17} /></Button>
          </form>
          {mode === 'login' && <><p className="auth-switch">Primeiro acesso? <Link to="/cadastro">Criar conta</Link></p>
            <div className="demo-access"><strong>Contas de demonstração</strong><div className="actions">{(['student', 'admin'] as const).map(role => <Button key={role} className="secondary" onClick={() => {
              setValue('email', demoAccounts[role], { shouldValidate: true }); setValue('password', demoPassword, { shouldValidate: true }); setError('');
            }}>{role === 'student' ? 'Preencher aluno' : 'Preencher admin'}</Button>)}</div></div></>}
        </div>}
    </section>
  </div>;
}
