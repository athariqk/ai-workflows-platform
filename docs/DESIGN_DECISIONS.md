# Design Documentation

## Database

**Entity Relationship Diagram**:\
Screenshot generated using DBeaver.

![Database ERD](./database_erd.png)\
**Some observations**:

- Why is the `Agent` table not referenced by other tables? This is because of two reasons. First, other tables simply have no need to reference it. Second, in `workflow_node`, we don't want to store a foreign key to some `Agent` because my intuition says that a single node should not be concerned with a particular data. Instead, it should be general enough such that we can easily assign/update/remove data without affecting the table schema.
- For this reason, I added `config` column in `workflow_node` table. This column should contain a json string (or binary) for any arbitrary data on a particular node. So, to reference an `Agent`, we can do it here.
- Input and output of each nodes are saved to `step_log` to allow audit.

**Things I would like to improve**:\
Currently this database design presents some flaws.

- Agent's `model` column is an enum, we can't easily add more or change it other than altering the assoociated enum data type. When given more time, I would like to add a nwe `model` table that will hold LLM records, which would benefit from easy management and associated metadata storage.
- Config based Node data means that if an `Agent` is updated, a node is left with outdated data. This is not optimal
- Non-linear workflow execution
