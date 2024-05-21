const express = require('express');
const cors = require('cors');
const redis = require('redis');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// In-memory data store
let todos = [];
let currentId = 1;
const publisher = redis.createClient();
const subscriber = publisher.duplicate();

publisher.connect();
subscriber.connect();

// SSE endpoint
app.get('/todo-subscription', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = data => {
    res.write(`data: ${data}\n\n`);
  };

  // Subscribe client to a Redis channel
  await subscriber.subscribe('todo_channel', message => {
    sendEvent(message);
  });

  // Remove client when connection closes
  req.on('close', async () => {
    await subscriber.unsubscribe('todo_channel');
  });
});

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
app.post('/todos', async (req, res) => {
  const todo = {
    id: currentId++,
    name: req.body.name,
  };
  await publisher.publish(
    'todo_channel',
    JSON.stringify({
      action: 'CREATE',
      data: todo,
    })
  );
  todos.push(todo);
  res.status(201).json(todo);
});

// Update
app.put('/todos/:id', async (req, res) => {
  const todo = todos.find(t => t.id === parseInt(req.params.id));
  if (todo) {
    todo.name = req.body.name;
    await publisher.publish(
      'todo_channel',
      JSON.stringify({
        action: 'UPDATE',
        data: todo,
      })
    );
    res.json(todo);
  } else {
    res.status(404).send('Todo not found');
  }
});

// Delete
app.delete('/todos/:id', async (req, res) => {
  const index = todos.findIndex(t => t.id === parseInt(req.params.id));
  if (index !== -1) {
    await publisher.publish(
      'todo_channel',
      JSON.stringify({
        action: 'DELETE',
        data: todos[index],
      })
    );
    todos.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).send('Todo not found');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
