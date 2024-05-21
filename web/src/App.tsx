import { useState } from 'react';
import { useCreateTodo, useDeleteTodo, useGetTodos } from './services';
import { Todo } from './types';

export default function App() {
  const { todos, isFetching } = useGetTodos();
  const { createTodo, isPending } = useCreateTodo();
  const { deleteTodo, isPending: isDeleting } = useDeleteTodo();
  const [text, setText] = useState('');

  if (isFetching) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Todos</h1>
      <form
        onSubmit={e => {
          e.preventDefault();
          if (text.length === 0) return;
          createTodo(text);
          setText('');
        }}
      >
        <input type="text" value={text} onChange={e => setText(e.target.value)} />
        <button type="submit" disabled={isPending}>
          Add Todo
        </button>
      </form>
      <ul>
        {todos.map((todo: Todo) => (
          <li
            key={todo.id}
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span>{todo.name}</span>
            <button onClick={() => deleteTodo(todo.id)} disabled={isDeleting}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
