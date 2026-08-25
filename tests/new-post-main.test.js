import { beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';

const { fsMock, readlineMock } = vi.hoisted(() => ({
  fsMock: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
  readlineMock: {
    createInterface: vi.fn(),
  },
}));

vi.mock('node:fs', () => ({ default: fsMock }));
vi.mock('node:readline', () => ({ default: readlineMock }));

import { main } from '../scripts/new-post.js';

const postsFile = path.resolve('posts/posts.json');
const contentDir = path.resolve('posts/content');
const placeholder = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80';

function mockInterface(answers, lines) {
  const rl = {
    question: vi.fn((prompt, callback) => callback(answers.shift())),
    close: vi.fn(),
    async *[Symbol.asyncIterator]() {
      yield* lines;
    },
  };
  readlineMock.createInterface.mockReturnValue(rl);
  return rl;
}

function prepareMain({ exists = false, answers, lines }) {
  const existing = {
    slug: 'existing',
    title: 'Existing',
    date: '2025-01-01',
    description: 'Existing post',
    thumbnail: '/existing.jpg',
    tags: ['old'],
    popular: false,
    favorite: false,
    readTime: '1 min read',
    file: 'posts/content/existing.md',
  };
  fsMock.existsSync.mockReturnValue(exists);
  fsMock.readFileSync.mockReturnValue(JSON.stringify([existing]));
  const rl = mockInterface(answers, lines);
  return { existing, rl };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.setSystemTime(new Date('2026-08-25T12:34:56Z'));
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('new-post main', () => {
  it('writes the markdown and exact post entry with the placeholder thumbnail', async () => {
    const markdown = '# New post\n\nA couple of lines.';
    const { existing, rl } = prepareMain({
      exists: false,
      answers: ['  My New Post  ', '  A description  ', ' Linux, CLI, , spaced ', '', 'y', 'n'],
      lines: ['# New post', '', 'A couple of lines.', 'END'],
    });

    await main();

    const entry = {
      slug: 'my-new-post',
      title: 'My New Post',
      date: '2026-08-25',
      description: 'A description',
      thumbnail: placeholder,
      tags: ['linux', 'cli', 'spaced'],
      popular: true,
      favorite: false,
      readTime: '1 min read',
      file: 'posts/content/my-new-post.md',
    };
    expect(fsMock.mkdirSync).toHaveBeenCalledWith(contentDir, { recursive: true });
    expect(fsMock.writeFileSync).toHaveBeenNthCalledWith(
      1,
      path.join(contentDir, 'my-new-post.md'),
      markdown
    );
    expect(fsMock.writeFileSync).toHaveBeenNthCalledWith(
      2,
      postsFile,
      JSON.stringify([entry, existing], null, 2)
    );
    expect(rl.close).toHaveBeenCalledOnce();
  });

  it('does not create the content directory when it already exists', async () => {
    const { rl } = prepareMain({
      exists: true,
      answers: ['Second Post', 'Description', 'tag', '/thumb.jpg', 'n', 'y'],
      lines: ['content', 'END'],
    });

    await main();

    expect(fsMock.mkdirSync).not.toHaveBeenCalled();
    expect(fsMock.writeFileSync).toHaveBeenCalledTimes(2);
    expect(rl.close).toHaveBeenCalledOnce();
  });
});
