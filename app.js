const express = require("express");
const app = express();
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3003, () => {
      console.log("Server running at 3003");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const priorityAndStatusObject = (priorAndStatObj) => {
  return (
    priorAndStatObj.priority !== undefined &&
    priorAndStatObj.status !== undefined
  );
};
const priorityObject = (priorObj) => {
  return priorObj.priority !== undefined;
};

const statusObject = (statObj) => {
  return statObj.status !== undefined;
};

const categoryObject = (catObj) => {
  return catObj.category !== undefined;
};

const categoryAndStatusObject = (catAndStatObj) => {
  return (
    catAndStatObj.category !== undefined && catAndStatObj.status !== undefined
  );
};

const categoryAndPriorityObject = (catAndPriorObj) => {
  return (
    catAndPriorObj.category !== undefined &&
    catAndPriorObj.priority !== undefined
  );
};

const searchPropertyObj = (searchQuery) => {
  return searchQuery.search_q !== undefined;
};

const todoObject = (todoObj) => {
  return {
    id: todoObj.id,
    todo: todoObj.todo,
    priority: todoObj.priority,
    status: todoObj.status,
    category: todoObj.category,
    dueDate: todoObj.due_date,
  };
};

//API 1
app.get("/todos/", async (req, res) => {
  const { search_q = "", priority, status, category } = req.query;
  let applyQuery = "";
  let data = null;

  switch (true) {
    case priorityAndStatusObject(req.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          applyQuery = `
                    SELECT * FROM todo 
                    WHERE 
                    priority = '${priority}'
                    AND status = '${status}';
                    `;

          data = await db.all(applyQuery);
          res.send(data.map((eachItem) => todoObject(eachItem)));
        } else {
          res.status(400);
          res.send("Invalid Todo Status");
        }
      } else {
        res.status(400);
        res.send("Invalid Todo Priority");
      }

      break;

    case categoryAndStatusObject(req.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          applyQuery = `
                    SELECT * FROM todo 
                    WHERE 
                    category = '${category}'
                    AND status = '${status}';
                    `;

          data = await db.all(applyQuery);
          res.send(data.map((eachItem) => todoObject(eachItem)));
        } else {
          res.status(400);
          res.send("Invalid Todo Status");
        }
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }

      break;
    case categoryAndPriorityObject(req.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          applyQuery = `
                    SELECT * FROM todo 
                    WHERE 
                    category = '${category}'
                    AND priority = '${priority}'
            `;
          data = await db.all(applyQuery);
          res.send(data.map((eachItem) => todoObject(eachItem)));
        } else {
          res.status(400);
          res.send("Invalid Todo Priority");
        }
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }

      break;
    case priorityObject(req.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        applyQuery = `
                SELECT * FROM todo 
                WHERE 
                priority = '${priority}';
            `;
        data = await db.all(applyQuery);
        res.send(data.map((eachItem) => todoObject(eachItem)));
      } else {
        res.status(400);
        res.send("Invalid Todo Priority");
      }
      break;
    case statusObject(req.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        applyQuery = `
                SELECT * FROM todo 
                WHERE 
                status = '${status}';
                `;
        data = await db.all(applyQuery);
        res.send(data.map((eachItem) => todoObject(eachItem)));
      } else {
        res.status(400);
        res.send("Invalid Todo Status");
      }
      break;
    case categoryObject(req.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        applyQuery = `
                SELECT * FROM todo 
                WHERE 
                category = '${category}';
            `;
        data = await db.all(applyQuery);
        res.send(data.map((eachItem) => todoObject(eachItem)));
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
      break;
    case searchPropertyObj(req.query):
      applyQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(applyQuery);
      res.send(data.map((eachItem) => todoObject(eachItem)));
      break;

    default:
      applyQuery = `
            SELECT * FROM todo `;
      data = await db.all(applyQuery);
      res.send(data.map((eachItem) => todoObject(eachItem)));
      break;
  }
});

//API 2
app.get("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const getTodoQuery = `
    SELECT * FROM todo 
    WHERE id = ${todoId};
    `;

  const todo = await db.get(getTodoQuery);
  res.send(todoObject(todo));
});

const dueDateObject = (dueDateObj) => {
  return dueDateObj.due_date !== undefined;
};

//API 3
app.get("/agenda/", async (req, res) => {
  const { date } = req.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getDueDateQuery = `SELECT * FROM todo WHERE  due_date = '${newDate}';`;
    const dueDate = await db.all(getDueDateQuery);
    res.send(dueDate.map((eachItem) => todoObject(eachItem)));
  } else {
    res.status(400);
    res.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", async (req, res) => {
  const { id, todo, priority, status, category, dueDate } = req.body;
  if (priority === "LOW" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const createTodoQuery = `
                        INSERT INTO 
                            todo(id, todo, priority, status, category, due_date)
                            VALUES 
                            (
                                ${id},
                                '${todo}',
                                '${priority}',
                                '${status}',
                                '${category}',
                                '${newDueDate}'
                            );
                        `;

          await db.run(createTodoQuery);
          res.send("Todo Successfully Added");
        } else {
          res.status(400);
          res.send("Invalid Due Date");
        }
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
    } else {
      res.status(400);
      res.send("Invalid Todo Status");
    }
  } else {
    res.status(400);
    res.send("Invalid Todo Priority");
  }
});

//API 5
app.put("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const requestBody = req.body;

  const prevQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const prevTodo = await db.get(prevQuery);

  const {
    todo = prevTodo.todo,
    priority = prevTodo.priority,
    status = prevTodo.status,
    category = prevTodo.category,
    dueDate = prevTodo.dueDate,
  } = req.body;

  let updateTodoQuery;

  switch (true) {
    case requestBody.todo !== undefined:
      updateTodoQuery = `
      UPDATE 
            todo 
        SET 
           todo='${todo}',
           priority='${priority}',
           status='${status}',
           category='${category}',
           due_date='${dueDate}'
        WHERE 
           id=${todoId};`;

      await db.run(updateTodoQuery);
      res.send(`Todo Updated`);
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `
            UPDATE 
                  todo 
             SET 
                todo='${todo}',
                priority='${priority}',
                status='${status}',
                category='${category}',
                due_date='${dueDate}'
             WHERE 
                id=${todoId};`;

        await db.run(updateTodoQuery);
        res.send("Priority Updated");
      } else {
        res.status(400);
        res.send("Invalid Todo Priority");
      }
      break;
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
                UPDATE 
                        todo 
                 SET 
                    todo='${todo}',
                    priority='${priority}',
                    status='${status}',
                    category='${category}',
                    due_date='${dueDate}'
                 WHERE 
                    id=${todoId};`;

        await db.run(updateTodoQuery);
        res.send("Status Updated");
      } else {
        res.status(400);
        res.send("Invalid Todo Status");
      }
      break;
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
            UPDATE 
                    todo 
                SET 
                todo='${todo}',
                priority='${priority}',
                status='${status}',
                category='${category}',
                due_date='${dueDate}'
                WHERE 
                id=${todoId};`;

        await db.run(updateTodoQuery);
        res.send("Category Updated");
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
            UPDATE 
                    todo 
            SET 
                todo='${todo}',
                priority='${priority}',
                status='${status}',
                category='${category}',
                due_date='${newDueDate}'
            WHERE 
                id=${todoId};`;

        await db.run(updateTodoQuery);
        res.send("Due Date Updated");
      } else {
        res.status(400);
        res.send("Invalid Due Date");
      }
      break;
  }
});

//API 6
app.delete("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const deleteTodoQuery = `
    DELETE FROM 
        todo
    WHERE 
        id = ${todoId};
    `;
  await db.run(deleteTodoQuery);
  res.send("Todo Deleted");
});

module.exports = app;
