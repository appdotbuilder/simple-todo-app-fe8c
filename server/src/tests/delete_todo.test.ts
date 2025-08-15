import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput, type CreateTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

// Test input for creating todos to delete
const testCreateInput: CreateTodoInput = {
  title: 'Test Todo for Deletion'
};

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo and return true', async () => {
    // First create a todo to delete
    const createResult = await db.insert(todosTable)
      .values({
        title: testCreateInput.title,
        completed: false
      })
      .returning()
      .execute();

    const createdTodo = createResult[0];
    expect(createdTodo).toBeDefined();
    expect(createdTodo.id).toBeDefined();

    // Delete the created todo
    const deleteInput: DeleteTodoInput = {
      id: createdTodo.id
    };

    const result = await deleteTodo(deleteInput);

    // Should return true indicating successful deletion
    expect(result).toBe(true);
  });

  it('should remove todo from database when deleted', async () => {
    // First create a todo to delete
    const createResult = await db.insert(todosTable)
      .values({
        title: testCreateInput.title,
        completed: false
      })
      .returning()
      .execute();

    const createdTodo = createResult[0];

    // Delete the todo
    const deleteInput: DeleteTodoInput = {
      id: createdTodo.id
    };

    await deleteTodo(deleteInput);

    // Verify the todo no longer exists in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent todo', async () => {
    // Try to delete a todo with an ID that doesn't exist
    const deleteInput: DeleteTodoInput = {
      id: 999999 // Non-existent ID
    };

    const result = await deleteTodo(deleteInput);

    // Should return false indicating no todo was found/deleted
    expect(result).toBe(false);
  });

  it('should not affect other todos when deleting specific todo', async () => {
    // Create multiple todos
    const createResult1 = await db.insert(todosTable)
      .values({
        title: 'Todo 1',
        completed: false
      })
      .returning()
      .execute();

    const createResult2 = await db.insert(todosTable)
      .values({
        title: 'Todo 2',
        completed: true
      })
      .returning()
      .execute();

    const todo1 = createResult1[0];
    const todo2 = createResult2[0];

    // Delete only the first todo
    const deleteInput: DeleteTodoInput = {
      id: todo1.id
    };

    const result = await deleteTodo(deleteInput);
    expect(result).toBe(true);

    // Verify first todo is deleted
    const deletedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo1.id))
      .execute();
    expect(deletedTodos).toHaveLength(0);

    // Verify second todo still exists
    const remainingTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo2.id))
      .execute();
    expect(remainingTodos).toHaveLength(1);
    expect(remainingTodos[0].title).toEqual('Todo 2');
    expect(remainingTodos[0].completed).toBe(true);
  });

  it('should handle deletion of completed todos correctly', async () => {
    // Create a completed todo
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        completed: true
      })
      .returning()
      .execute();

    const completedTodo = createResult[0];

    // Delete the completed todo
    const deleteInput: DeleteTodoInput = {
      id: completedTodo.id
    };

    const result = await deleteTodo(deleteInput);

    // Should successfully delete completed todos too
    expect(result).toBe(true);

    // Verify it's actually deleted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, completedTodo.id))
      .execute();
    expect(todos).toHaveLength(0);
  });
});