import type { Book, Library } from '../types/library.ts';

export const categories = ['Literatura brasileira', 'Ficção científica', 'Ficção', 'Fantasia', 'Não ficção', 'Tecnologia'];
export const libraryInfo = {
  school: 'ETEC Raposo Tavares',
  hours: 'Horários a confirmar pela escola',
  location: 'Localização interna a confirmar',
  contact: 'Canal de atendimento a confirmar',
};
const titles = [
  ['Dom Casmurro', 'Machado de Assis', 'Literatura brasileira', '1899', '9788535910663', 'Memória, ciúme e dúvida atravessam o relato de Bento Santiago sobre sua vida com Capitu.'],
  ['1984', 'George Orwell', 'Ficção científica', '1949', '9780451524935', 'Winston Smith tenta preservar sua liberdade em uma sociedade vigiada pelo Grande Irmão.'],
  ['O Pequeno Príncipe', 'Antoine de Saint-Exupéry', 'Fantasia', '1943', '9780156012195', 'Um piloto encontra um viajante de outro planeta e redescobre o valor da amizade.'],
  ['A Hora da Estrela', 'Clarice Lispector', 'Literatura brasileira', '1977', '9788532508126', 'Macabéa chega ao Rio de Janeiro em busca de uma vida melhor.'],
  ['O Hobbit', 'J. R. R. Tolkien', 'Fantasia', '1937', '9780547928227', 'Bilbo Bolseiro deixa o Condado para uma jornada com um grupo de anões.'],
  ['Frankenstein', 'Mary Shelley', 'Ficção', '1818', '9780141439471', 'Uma criatura abandonada confronta o cientista que lhe deu vida.'],
  ['Sapiens', 'Yuval Noah Harari', 'Não ficção', '2011', '9780062316097', 'Uma leitura sobre a trajetória da humanidade e as ideias que moldaram nossas sociedades.'],
  ['Código Limpo', 'Robert C. Martin', 'Tecnologia', '2008', '9780132350884', 'Práticas para escrever e manter código legível.'],
];

const books: Book[] = titles.map(([title, author, category, year, isbn, synopsis], i) => ({
  id: String(i + 1), title, author, category, year: Number(year), isbn, synopsis,
  publisher: ['Companhia das Letras', 'Signet Classics', 'Mariner Books', 'Rocco', 'Mariner Books', 'Penguin Classics', 'Harper', 'Prentice Hall'][i],
  edition: 'Demonstrativa', cover: '/covers/' + (i + 1) + '.svg',
}));

export const demoPassword = 'Bibliotech123';
export const demoAccounts = { student: 'aluno@bibliotech.demo', admin: 'admin@bibliotech.demo' };
export function seedLibrary(now = new Date()): Library {
  const day = (offset: number) => new Date(now.getTime() + offset * 86_400_000).toISOString();
  return {
    books,
    copies: books.flatMap((book, i) => Array.from({ length: i % 3 === 0 ? 1 : 2 }, (_, j) => ({
      id: book.id + '-' + j, bookId: book.id, accession: 'BT-' + String((i + 1) * 10 + j).padStart(4, '0'),
      condition: 'Bom', status: i === 3 || (i === 1 && j === 0) ? 'ON_LOAN' as const : 'AVAILABLE' as const,
    }))),
    users: [
      { id: 'student', name: 'Mariana Costa', email: demoAccounts.student, password: demoPassword, role: 'student', status: 'ACTIVE', createdAt: day(-35) },
      { id: 'admin', name: 'Alex Martins', email: demoAccounts.admin, password: demoPassword, role: 'admin', status: 'ACTIVE', createdAt: day(-60) },
      { id: 'demo-overdue', name: 'Rafael Santos', email: 'rafael@bibliotech.demo', password: demoPassword, role: 'student', status: 'ACTIVE', createdAt: day(-40) },
    ],
    reservations: [
      { id: 'demo-pending', userId: 'student', bookId: '3', status: 'PENDING', requestedAt: day(-1) },
      { id: 'demo-active', userId: 'student', bookId: '2', copyId: '2-0', status: 'APPROVED', requestedAt: day(-7), pickedUpAt: day(-6), dueAt: day(6) },
      { id: 'demo-late', userId: 'demo-overdue', bookId: '4', copyId: '4-0', status: 'APPROVED', requestedAt: day(-20), pickedUpAt: day(-18), dueAt: day(-4) },
    ],
  };
}
