import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, CheckCircle2, Circle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  // Form state for creating new todos
  const [newTodoTitle, setNewTodoTitle] = useState('');

  // Load todos from server
  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
      // Since backend is stubbed, show some demo data
      console.log('Note: Backend handlers are stubs - using demo data');
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Create new todo
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    setIsLoading(true);
    try {
      const todoInput: CreateTodoInput = {
        title: newTodoTitle.trim()
      };
      
      const newTodo = await trpc.createTodo.mutate(todoInput);
      setTodos((prev: Todo[]) => [newTodo, ...prev]);
      setNewTodoTitle('');
    } catch (error) {
      console.error('Failed to create todo:', error);
      // Since backend is stubbed, create a local todo for demo
      const demoTodo: Todo = {
        id: Date.now(),
        title: newTodoTitle.trim(),
        completed: false,
        created_at: new Date(),
        updated_at: new Date()
      };
      setTodos((prev: Todo[]) => [demoTodo, ...prev]);
      setNewTodoTitle('');
      console.log('Note: Backend handlers are stubs - created demo todo locally');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle todo completion status
  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updateInput: UpdateTodoInput = {
        id: todo.id,
        completed: !todo.completed
      };
      
      const updatedTodo = await trpc.updateTodo.mutate(updateInput);
      if (updatedTodo) {
        setTodos((prev: Todo[]) => 
          prev.map((t: Todo) => t.id === todo.id ? updatedTodo : t)
        );
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
      // Since backend is stubbed, update locally for demo
      setTodos((prev: Todo[]) => 
        prev.map((t: Todo) => 
          t.id === todo.id 
            ? { ...t, completed: !t.completed, updated_at: new Date() }
            : t
        )
      );
      console.log('Note: Backend handlers are stubs - updated demo todo locally');
    }
  };

  // Start editing a todo
  const handleStartEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
  };

  // Save edited todo
  const handleSaveEdit = async (todo: Todo) => {
    if (!editTitle.trim()) return;

    try {
      const updateInput: UpdateTodoInput = {
        id: todo.id,
        title: editTitle.trim()
      };
      
      const updatedTodo = await trpc.updateTodo.mutate(updateInput);
      if (updatedTodo) {
        setTodos((prev: Todo[]) => 
          prev.map((t: Todo) => t.id === todo.id ? updatedTodo : t)
        );
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
      // Since backend is stubbed, update locally for demo
      setTodos((prev: Todo[]) => 
        prev.map((t: Todo) => 
          t.id === todo.id 
            ? { ...t, title: editTitle.trim(), updated_at: new Date() }
            : t
        )
      );
      console.log('Note: Backend handlers are stubs - updated demo todo locally');
    } finally {
      setEditingId(null);
      setEditTitle('');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  // Delete todo
  const handleDeleteTodo = async (todoId: number) => {
    try {
      const success = await trpc.deleteTodo.mutate({ id: todoId });
      if (success) {
        setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
      // Since backend is stubbed, delete locally for demo
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
      console.log('Note: Backend handlers are stubs - deleted demo todo locally');
    }
  };

  const completedTodos = todos.filter((t: Todo) => t.completed);
  const pendingTodos = todos.filter((t: Todo) => !t.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✅ My Todo App</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Create Todo Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Todo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTodo} className="flex gap-2">
              <Input
                placeholder="What needs to be done? 🚀"
                value={newTodoTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTodoTitle(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !newTodoTitle.trim()}>
                {isLoading ? 'Adding...' : 'Add Todo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{todos.length}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{pendingTodos.length}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{completedTodos.length}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
        </div>

        {todos.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No todos yet!</h3>
              <p className="text-gray-500">Add your first task above to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Pending Todos */}
            {pendingTodos.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Circle className="w-5 h-5" />
                  Pending Tasks ({pendingTodos.length})
                </h2>
                <div className="space-y-2">
                  {pendingTodos.map((todo: Todo) => (
                    <Card key={todo.id} className="shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={todo.completed}
                            onCheckedChange={() => handleToggleComplete(todo)}
                            className="w-5 h-5"
                          />
                          
                          {editingId === todo.id ? (
                            <div className="flex-1 flex items-center gap-2">
                              <Input
                                value={editTitle}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value)}
                                className="flex-1"
                                onKeyDown={(e: React.KeyboardEvent) => {
                                  if (e.key === 'Enter') handleSaveEdit(todo);
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                                autoFocus
                              />
                              <Button size="sm" onClick={() => handleSaveEdit(todo)}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <p className="font-medium text-gray-800">{todo.title}</p>
                                <p className="text-xs text-gray-500">
                                  Created: {todo.created_at.toLocaleDateString()} at {todo.created_at.toLocaleTimeString()}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary">Pending</Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStartEdit(todo)}
                                  className="p-2"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="p-2 text-red-600 hover:text-red-700">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Todo</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteTodo(todo.id)}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Todos */}
            {completedTodos.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Completed Tasks ({completedTodos.length})
                </h2>
                <div className="space-y-2">
                  {completedTodos.map((todo: Todo) => (
                    <Card key={todo.id} className="shadow-md hover:shadow-lg transition-shadow opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={todo.completed}
                            onCheckedChange={() => handleToggleComplete(todo)}
                            className="w-5 h-5"
                          />
                          
                          <div className="flex-1">
                            <p className="font-medium text-gray-600 line-through">{todo.title}</p>
                            <p className="text-xs text-gray-500">
                              Completed: {todo.updated_at.toLocaleDateString()} at {todo.updated_at.toLocaleTimeString()}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Badge variant="default" className="bg-green-600">Completed</Badge>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="p-2 text-red-600 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Todo</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTodo(todo.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Note about stub implementation */}
        {todos.length > 0 && (
          <Card className="mt-8 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <p className="text-sm text-yellow-800">
                📝 <strong>Note:</strong> The backend handlers are currently stub implementations. 
                Todo operations work locally for demonstration purposes. Check the browser console for details.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;