import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput, type Todo } from '../schema';

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  try {
    // Insert todo record
    const result = await db.insert(todosTable)
      .values({
        title: input.title,
        completed: false, // Default value from schema
        // created_at and updated_at are automatically set by defaultNow()
      })
      .returning()
      .execute();

    // Return the created todo
    const todo = result[0];
    return {
      ...todo,
      // No numeric conversions needed - all fields are already correct types
    };
  } catch (error) {
    console.error('Todo creation failed:', error);
    throw error;
  }
}