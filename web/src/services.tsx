import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from './main';
import { Todo } from './types';
import { useEffect } from 'react';

export const useGetTodos = () => {
  const { data, isFetching, isError } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/todos');
      return response.json();
    },
  });

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3000/todo-subscription');
    eventSource.onmessage = event => {
      const data = JSON.parse(event.data) as { action: string; data: Todo };
      if (data.action === 'CREATE') {
        queryClient.setQueryData(['todos'], (old: Todo[]) => [...old, data.data]);
      } else if (data.action === 'DELETE') {
        queryClient.setQueryData(['todos'], (old: Todo[]) => old.filter(todo => todo.id !== data.data.id));
      }
    };
  }, []);

  return {
    todos: data,
    isFetching,
    isError,
  };
};

export const useCreateTodo = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('http://localhost:3000/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      return response.json();
    },
  });

  return {
    createTodo: mutateAsync,
    isPending,
  };
};

export const useDeleteTodo = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:3000/todos/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },
  });

  return {
    deleteTodo: mutateAsync,
    isPending,
  };
};
