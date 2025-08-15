import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTodoInput = {
  title: 'Test Todo Item'
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo with correct properties', async () => {
    const result = await createTodo(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Todo Item');
    expect(result.completed).toEqual(false); // Default value
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save todo to database', async () => {
    const result = await createTodo(testInput);

    // Query using proper drizzle syntax
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Test Todo Item');
    expect(todos[0].completed).toEqual(false);
    expect(todos[0].created_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create todo with different titles', async () => {
    const input1: CreateTodoInput = { title: 'First Todo' };
    const input2: CreateTodoInput = { title: 'Second Todo' };

    const result1 = await createTodo(input1);
    const result2 = await createTodo(input2);

    expect(result1.title).toEqual('First Todo');
    expect(result2.title).toEqual('Second Todo');
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createTodo(testInput);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should create multiple todos independently', async () => {
    const todos = await Promise.all([
      createTodo({ title: 'Todo 1' }),
      createTodo({ title: 'Todo 2' }),
      createTodo({ title: 'Todo 3' })
    ]);

    // Verify all todos were created
    expect(todos).toHaveLength(3);
    todos.forEach((todo, index) => {
      expect(todo.title).toEqual(`Todo ${index + 1}`);
      expect(todo.completed).toEqual(false);
      expect(todo.id).toBeDefined();
    });

    // Verify they have different IDs
    const ids = todos.map(todo => todo.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toEqual(3);

    // Verify all are saved in database
    const allTodos = await db.select().from(todosTable).execute();
    expect(allTodos).toHaveLength(3);
  });
});