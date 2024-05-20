const evtSource = new EventSource('http://localhost:3000/todo-subscription');

evtSource.onmessage = event => {
  console.log(event.data);
};

document.addEventListener('DOMContentLoaded', () => {
  const apiUrl = 'http://localhost:3000/todos';
  const todoForm = document.getElementById('todoForm');
  const todoNameInput = document.getElementById('todoName');
  const todoList = document.getElementById('todoList');

  fetchTodos();

  todoForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = todoNameInput.value.trim();
    if (name) {
      await addTodo({ name });
      todoNameInput.value = '';
      fetchTodos();
    }
  });

  async function fetchTodos() {
    try {
      const response = await fetch(apiUrl);
      const todos = await response.json();
      renderTodos(todos);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  }

  async function addTodo(todo) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo),
      });
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  }

  async function deleteTodo(id) {
    try {
      await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
      fetchTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  }

  async function updateTodo(id, name) {
    try {
      await fetch(`${apiUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      fetchTodos();
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  }

  function renderTodos(todos) {
    todoList.innerHTML = '';
    todos.forEach(todo => {
      const tr = document.createElement('tr');

      const idTd = document.createElement('td');
      idTd.textContent = todo.id;
      tr.appendChild(idTd);

      const nameTd = document.createElement('td');
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = todo.name;
      nameInput.addEventListener('blur', () => {
        updateTodo(todo.id, nameInput.value);
      });
      nameTd.appendChild(nameInput);
      tr.appendChild(nameTd);

      const actionsTd = document.createElement('td');
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => {
        deleteTodo(todo.id);
      });
      actionsTd.appendChild(deleteButton);
      tr.appendChild(actionsTd);

      todoList.appendChild(tr);
    });
  }
});
