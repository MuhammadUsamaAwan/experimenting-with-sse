const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// In-memory data store
let todos = [];
let currentId = 1;
let clients = [];

// SSE endpoint
app.get('/todo-subscription', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Add client to clients array
  clients.push(res);

  // Remove client when connection closes
  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

const sendEventToAll = data => {
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

// Read all
app.get('/todos', (req, res) => {
  res.json(todos);
});

// Read one
app.get('/todos/:id', (req, res) => {
  const todo = todos.find(t => t.id === parseInt(req.params.id));
  if (todo) {
    res.json(todo);
  } else {
    res.status(404).send('Todo not found');
  }
});

// Create
app.post('/todos', (req, res) => {
  const todo = {
    id: currentId++,
    name: req.body.name,
  };
  sendEventToAll({
    action: 'CREATE',
    data: todo,
  });
  todos.push(todo);
  res.status(201).json(todo);
});

// Update
app.put('/todos/:id', (req, res) => {
  const todo = todos.find(t => t.id === parseInt(req.params.id));
  if (todo) {
    todo.name = req.body.name;
    sendEventToAll({
      action: 'UPDATE',
      data: todo,
    });
    res.json(todo);
  } else {
    res.status(404).send('Todo not found');
  }
});

// Delete
app.delete('/todos/:id', (req, res) => {
  const index = todos.findIndex(t => t.id === parseInt(req.params.id));
  if (index !== -1) {
    sendEventToAll({
      action: 'DELETE',
      data: todos[index],
    });
    todos.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).send('Todo not found');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
