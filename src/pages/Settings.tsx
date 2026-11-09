import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, ConfirmDialog, ErrorText, Field, PageHeader, errorMessage } from '../components/ui';
import { useLibrary } from '../contexts/LibraryContext';
import { nameSchema, strongPassword } from './public/Auth';

const profileSchema = z.object({ name: nameSchema });
const securitySchema = z.object({ current: z.string().min(1, 'Informe a senha atual.'), password: strongPassword, confirmation: z.string() })
  .refine(value => value.password === value.confirmation, { path: ['confirmation'], message: 'As senhas precisam ser iguais.' });

export function Settings() {
  const { user, act, notify } = useLibrary();
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [reset, setReset] = useState(false);
  const profile = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name ?? '' } });
  const security = useForm({ resolver: zodResolver(securitySchema), defaultValues: { current: '', password: '', confirmation: '' } });
  return <>
    <PageHeader title="Configurações" description="Gerencie seus dados de acesso à biblioteca." />
    <div className="settings">
      <section className="panel"><h2>Perfil</h2><p>Seu nome aparece nas reservas da biblioteca.</p>
        <form onSubmit={profile.handleSubmit(values => {
          setProfileError('');
          try { act({ type: 'profile', name: values.name }); notify('Perfil atualizado.'); }
          catch (cause) { setProfileError(errorMessage(cause)); }
        })}><Field label="Nome completo" error={profile.formState.errors.name?.message}><input autoComplete="name" {...profile.register('name')} /></Field>
          <Field label="E-mail"><input type="email" readOnly value={user?.email ?? ''} /></Field>
          <ErrorText message={profileError} /><Button type="submit">Salvar alterações</Button>
        </form></section>
      <section className="panel"><h2>Segurança</h2><p>Atualize sua senha de acesso.</p>
        <form onSubmit={security.handleSubmit(values => {
          setPasswordError('');
          try { act({ type: 'password', ...values }); security.reset(); notify('Senha atualizada.'); }
          catch (cause) { setPasswordError(errorMessage(cause)); }
        })}>{([['current', 'Senha atual'], ['password', 'Nova senha'], ['confirmation', 'Confirme a nova senha']] as const).map(([name, label]) =>
          <Field key={name} label={label} error={security.formState.errors[name]?.message}><input type="password" autoComplete={name === 'current' ? 'current-password' : 'new-password'} {...security.register(name)} /></Field>)}
          <p className="hint">Pelo menos oito caracteres e um número.</p><ErrorText message={passwordError} /><Button type="submit">Alterar senha</Button>
        </form></section>
      {user?.role === 'admin' && <section className="panel"><h2>Dados demonstrativos</h2><p>Reponha o acervo, as contas e as reservas do cenário inicial neste navegador.</p><Button className="secondary" onClick={() => setReset(true)}>Restaurar demonstração</Button></section>}
    </div>
    {reset && <ConfirmDialog title="Restaurar demonstração" text="As alterações locais, incluindo contas novas e reservas registradas, serão substituídas pelos dados iniciais." onClose={() => setReset(false)} onConfirm={() => {
      act({ type: 'reset' }); profile.reset({ name: 'Alex Martins' }); security.reset(); notify('Dados demonstrativos restaurados.');
    }} />}
  </>;
}
