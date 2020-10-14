const AWS = require('aws-sdk');
const express = require('express')
const app = express()
const port = 8080
const randtoken = require('rand-token');

AWS.config.update({ region: 'us-east-1' });

const client = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

app.use(express.json());
app.use(express.urlencoded());

const TodoRepository = (db) => {
  const TableName = "todos";

  const get = id => {
    const params = { TableName, Key: { id } };
    return new Promise((resolve, reject) =>
      db.get(params, (error, data) => error ? reject(error) : resolve(data.Item)))
  }

  const post = data => {
    const id = randtoken.uid(16);
    const params = { TableName, Item: { id, ...data } };  
    return new Promise((resolve, reject) => 
      db.put(params, (error) => error ? reject(error) : resolve(get(id))))
  }

  const put = (id, data) => {
    const params = {
      TableName,
      Key: { id },
      UpdateExpression: 'set description = :d',
      ExpressionAttributeValues: { ':d': data }
    };
    return new Promise((resolve, reject) => 
      db.update(params, (error) => error ? reject(error) : resolve(get(id))))
  }

  const remove = id => {
    const params = { TableName, Key: {id: id } };
    return new Promise((resolve, reject) => 
      db.delete(params, (error) => error ? reject(error) : resolve()))
  }

  return { get, post, put, remove }
}

app.get('/todo/:id', async (req, res) => res.send(await TodoRepository(client).get(req.params.id)));
app.post('/todo', async (req, res) => res.send(await TodoRepository(client).post(req.body)));
app.put('/todo/:id', async (req, res) => res.send(await TodoRepository(client).put(req.params.id, req.body.description)));
app.delete('/todo/:id', async (req, res) => res.send(await TodoRepository(client).remove(req.params.id)));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
