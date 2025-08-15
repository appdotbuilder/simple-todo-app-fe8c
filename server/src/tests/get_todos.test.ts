import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all todos ordered by creation date (newest first)', async () => {
    // Create test todos with slight delay to ensure different timestamps
    const todo1 = await db.insert(todosTable)
      .values({
        title: 'First todo',
        completed: false
      })
      .returning()
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const todo2 = await db.insert(todosTable)
      .values({
        title: 'Second todo',
        completed: true
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const todo3 = await db.insert(todosTable)
      .values({
        title: 'Third todo',
        completed: false
      })
      .returning()
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify ordering by creation date (newest first)
    expect(result[0].title).toBe('Third todo');
    expect(result[1].title).toBe('Second todo');
    expect(result[2].title).toBe('First todo');

    // Verify all fields are present and correct types
    result.forEach(todo => {
      expect(todo.id).toBeNumber();
      expect(todo.title).toBeString();
      expect(todo.completed).toBeBoolean();
      expect(todo.created_at).toBeInstanceOf(Date);
      expect(todo.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return todos with correct field values', async () => {
    const testTodo = {
      title: 'Test todo item',
      completed: true
    };

    await db.insert(todosTable)
      .values(testTodo)
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe(testTodo.title);
    expect(result[0].completed).toBe(testTodo.completed);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle mixed completion states correctly', async () => {
    // Create todos with different completion states
    await db.insert(todosTable)
      .values([
        { title: 'Completed todo', completed: true },
        { title: 'Incomplete todo', completed: false },
        { title: 'Another completed todo', completed: true }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    const completedTodos = result.filter(todo => todo.completed);
    const incompleteTodos = result.filter(todo => !todo.completed);

    expect(completedTodos).toHaveLength(2);
    expect(incompleteTodos).toHaveLength(1);
  });

  it('should maintain consistent data types', async () => {
    await db.insert(todosTable)
      .values({
        title: 'Type check todo',
        completed: false
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    const todo = result[0];

    expect(typeof todo.id).toBe('number');
    expect(typeof todo.title).toBe('string');
    expect(typeof todo.completed).toBe('boolean');
    expect(todo.created_at).toBeInstanceOf(Date);
    expect(todo.updated_at).toBeInstanceOf(Date);
  });
});