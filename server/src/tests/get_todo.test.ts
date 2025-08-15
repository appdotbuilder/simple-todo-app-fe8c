import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput } from '../schema';
import { getTodo } from '../handlers/get_todo';

describe('getTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a todo when it exists', async () => {
    // Create a test todo
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        completed: false
      })
      .returning()
      .execute();

    const createdTodo = insertResult[0];

    // Test input
    const testInput: GetTodoInput = {
      id: createdTodo.id
    };

    // Get the todo
    const result = await getTodo(testInput);

    // Verify the result
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdTodo.id);
    expect(result!.title).toEqual('Test Todo');
    expect(result!.completed).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when todo does not exist', async () => {
    const testInput: GetTodoInput = {
      id: 999 // Non-existent ID
    };

    const result = await getTodo(testInput);

    expect(result).toBeNull();
  });

  it('should return correct todo when multiple todos exist', async () => {
    // Create multiple test todos
    const todos = await db.insert(todosTable)
      .values([
        { title: 'First Todo', completed: false },
        { title: 'Second Todo', completed: true },
        { title: 'Third Todo', completed: false }
      ])
      .returning()
      .execute();

    // Get the second todo
    const testInput: GetTodoInput = {
      id: todos[1].id
    };

    const result = await getTodo(testInput);

    // Verify we got the correct todo
    expect(result).toBeDefined();
    expect(result!.id).toEqual(todos[1].id);
    expect(result!.title).toEqual('Second Todo');
    expect(result!.completed).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle completed and uncompleted todos correctly', async () => {
    // Create completed todo
    const completedTodo = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        completed: true
      })
      .returning()
      .execute();

    // Create uncompleted todo
    const incompleteTodo = await db.insert(todosTable)
      .values({
        title: 'Incomplete Todo',
        completed: false
      })
      .returning()
      .execute();

    // Test completed todo
    const completedResult = await getTodo({ id: completedTodo[0].id });
    expect(completedResult).toBeDefined();
    expect(completedResult!.completed).toEqual(true);
    expect(completedResult!.title).toEqual('Completed Todo');

    // Test incomplete todo
    const incompleteResult = await getTodo({ id: incompleteTodo[0].id });
    expect(incompleteResult).toBeDefined();
    expect(incompleteResult!.completed).toEqual(false);
    expect(incompleteResult!.title).toEqual('Incomplete Todo');
  });

  it('should preserve all todo fields correctly', async () => {
    // Create a todo and get its initial timestamps
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Field Test Todo',
        completed: true
      })
      .returning()
      .execute();

    const originalTodo = insertResult[0];

    // Retrieve the todo
    const result = await getTodo({ id: originalTodo.id });

    // Verify all fields match exactly
    expect(result).toBeDefined();
    expect(result!.id).toEqual(originalTodo.id);
    expect(result!.title).toEqual(originalTodo.title);
    expect(result!.completed).toEqual(originalTodo.completed);
    expect(result!.created_at).toEqual(originalTodo.created_at);
    expect(result!.updated_at).toEqual(originalTodo.updated_at);
  });
});