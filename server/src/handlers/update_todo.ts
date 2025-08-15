import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateTodo(input: UpdateTodoInput): Promise<Todo | null> {
  try {
    // Build the update values object with only provided fields
    const updateValues: Partial<typeof todosTable.$inferInsert> = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.title !== undefined) {
      updateValues.title = input.title;
    }

    if (input.completed !== undefined) {
      updateValues.completed = input.completed;
    }

    // Update the todo and return the updated record
    const result = await db.update(todosTable)
      .set(updateValues)
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    // Return null if no todo was found with the given ID
    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Todo update failed:', error);
    throw error;
  }
}