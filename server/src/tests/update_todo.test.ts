import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Helper function to create a test todo
async function createTestTodo(title: string = 'Test Todo'): Promise<number> {
  const result = await db.insert(todosTable)
    .values({
      title,
      completed: false
    })
    .returning()
    .execute();
  
  return result[0].id;
}

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title only', async () => {
    // Create a test todo
    const todoId = await createTestTodo('Original Title');
    
    const input: UpdateTodoInput = {
      id: todoId,
      title: 'Updated Title'
    };

    const result = await updateTodo(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todoId);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.completed).toEqual(false); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update completed status only', async () => {
    // Create a test todo
    const todoId = await createTestTodo('Test Todo');
    
    const input: UpdateTodoInput = {
      id: todoId,
      completed: true
    };

    const result = await updateTodo(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todoId);
    expect(result!.title).toEqual('Test Todo'); // Should remain unchanged
    expect(result!.completed).toEqual(true);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update both title and completed status', async () => {
    // Create a test todo
    const todoId = await createTestTodo('Original Todo');
    
    const input: UpdateTodoInput = {
      id: todoId,
      title: 'Updated Todo',
      completed: true
    };

    const result = await updateTodo(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todoId);
    expect(result!.title).toEqual('Updated Todo');
    expect(result!.completed).toEqual(true);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Create a test todo
    const todoId = await createTestTodo();
    
    // Get the original todo
    const originalTodo = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    const originalUpdatedAt = originalTodo[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateTodoInput = {
      id: todoId,
      title: 'Updated Title'
    };

    const result = await updateTodo(input);

    expect(result).not.toBeNull();
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should save updated todo to database', async () => {
    // Create a test todo
    const todoId = await createTestTodo('Original Title');
    
    const input: UpdateTodoInput = {
      id: todoId,
      title: 'Database Updated Title',
      completed: true
    };

    await updateTodo(input);

    // Query the database directly to verify the update
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Database Updated Title');
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent todo', async () => {
    const input: UpdateTodoInput = {
      id: 99999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateTodo(input);

    expect(result).toBeNull();
  });

  it('should handle partial updates correctly', async () => {
    // Create a test todo with specific values
    const todoId = await createTestTodo('Partial Update Test');
    
    // First, mark it as completed
    await updateTodo({
      id: todoId,
      completed: true
    });

    // Then update only the title, completed should remain true
    const input: UpdateTodoInput = {
      id: todoId,
      title: 'Only Title Updated'
    };

    const result = await updateTodo(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Only Title Updated');
    expect(result!.completed).toEqual(true); // Should remain true from previous update
  });

  it('should handle empty title update gracefully', async () => {
    // Note: This test assumes validation happens at the router/input level
    // The handler itself doesn't validate - it trusts the parsed input
    const todoId = await createTestTodo('Original Title');
    
    const input: UpdateTodoInput = {
      id: todoId,
      title: '' // Empty string - should be caught by Zod validation before reaching handler
    };

    // If this reaches the handler, it means validation was bypassed
    // The handler should still update the database with the provided value
    const result = await updateTodo(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});