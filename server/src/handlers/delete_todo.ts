import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteTodo(input: DeleteTodoInput): Promise<boolean> {
  try {
    // Delete the todo with the given ID
    const result = await db.delete(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    // Return true if a row was deleted, false if no todo was found with that ID
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Todo deletion failed:', error);
    throw error;
  }
}