// 1. Import Dependencies
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const verifyToken = require('./verifyToken');

// 2. Initialize the Express App
const app = express();
const PORT = 5000;

// 3. Apply Middleware
app.use(cors()); // Allows requests from your front-end (port 3000)
app.use(express.json()); // Allows the server to read JSON data from request bodies

// 4. PostgreSQL Database Connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'University Research',
  password: 'mohit',
  port: 5432,
});

// 5. API Endpoints (Your API)

// --- GET: Fetch all research projects ---
app.get('/api/projects', async (req, res) => {
  try {
    // Note: We use quotes "" because the table name has capital letters
    const result = await pool.query('SELECT * FROM Research_Projects');
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Fetch all publications ---
app.get('/api/publications', async (req, res) => {
  try {
    // We need to use quotes for "Publications"
    const result = await pool.query('SELECT * FROM publications');
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Fetch all researchers ---
app.get('/api/researchers', async (req, res) => {
  try {
    // We use lowercase 'researchers' as we discovered during login
    const result = await pool.query('SELECT * FROM researchers');
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Fetch all departments ---
app.get('/api/departments', async (req, res) => {
  try {
    // We need to use quotes for "Departments"
    const result = await pool.query('SELECT * FROM departments');
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Get the next available Project ID ---
app.get('/api/projects/next-id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const query = `
      SELECT project_id FROM Research_Projects 
      ORDER BY CAST(SUBSTRING(project_id FROM 4) AS INTEGER) DESC
      LIMIT 1
    `;
    const result = await pool.query(query);
    
    let nextId = 'PRJ01'; // Default if table is empty
    if (result.rowCount > 0) {
      const lastId = result.rows[0].project_id; // e.g., "P005"
      const lastNum = parseInt(lastId.substring(3)); // 5
      nextId = 'PRJ' + String(lastNum + 1).padStart(2, '0'); // "P006"
    }
    res.json({ nextId });
  } catch (err) {
    console.error('Error fetching next ID:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. GET: "My Projects" (for project tiles)
app.get('/api/projects/my-projects', verifyToken, async (req, res) => {
  try {

    console.log('Fetching projects for user ID:', req.user.id);

    const query = `
      SELECT p.* FROM Research_Projects p
      JOIN Members m ON p.project_id = m.project_id
      WHERE m.researcher_id = $1
    `;
    const result = await pool.query(query, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching my-projects:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Search for projects (for admin filter) ---
app.get('/api/projects/search', verifyToken, async (req, res) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm || searchTerm.length < 3) {
      return res.json([]);
    }
    
    const query = `
      SELECT project_id, title FROM Research_Projects
      WHERE title ILIKE $1
      LIMIT 10
    `;
    const result = await pool.query(query, [`%${searchTerm}%`]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error searching projects:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// --- GET: Fetch members for a SINGLE project ---
app.get('/api/projects/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const query =
      'SELECT r.name, r.position, m.role FROM researchers r JOIN members m ON r.researcher_id = m.researcher_id WHERE m.project_id = $1';
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/projects/:id/publications', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT p.title, p.publication_id 
      FROM publications p
      JOIN Result_in ri ON p.publication_id = ri.publication_id 
      WHERE ri.project_id = $1
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Fetch all department details (for cards) ---
app.get('/api/departments/details', async (req, res) => {
  try {
    const query = `
      SELECT 
        d.department_id, 
        d.department_name, 
        h.name AS hod_name, 
        COUNT(r.researcher_id) AS researcher_count
      FROM 
        Departments d
      LEFT JOIN 
        researchers h ON d.hod = h.researcher_id
      LEFT JOIN 
        researchers r ON d.department_id = r.department
      GROUP BY 
        d.department_id, h.name
      ORDER BY
        d.department_name;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err){
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- GET: Fetch equipment for a SINGLE department (for modal) ---
app.get('/api/departments/:id/equipment', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT equipment_id, equipment_name, model 
      FROM equipments
      WHERE managed_by = $1
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Fetch all publications (for cards) ---
app.get('/api/publications/details', async (req, res) => {
  try {
    const query = `
      SELECT publication_id, title, journal, publication_date, DOI
      FROM Publications
      ORDER BY publication_date DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Fetch authors for a SINGLE publication (for modal) ---
app.get('/api/publications/:id/authors', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT r.name, a.re_order
      FROM researchers r
      JOIN Authors a ON r.researcher_id = a.researcher_id
      WHERE a.publication_id = $1
      ORDER BY a.re_order ASC;
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Fetch project for a SINGLE publication (for modal) ---
app.get('/api/publications/:id/project', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT p.title, p.project_id
      FROM Research_Projects p
      JOIN Result_in ri ON p.project_id = ri.project_id
      WHERE ri.publication_id = $1;
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows); // Send back all related projects (usually one)
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- POST: Handle User Login ---
app.post('/api/login', async (req, res) => {
  // Get email and password from the front-end
  const { email, researcher_id_password } = req.body;

  if (!email || !researcher_id_password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 1. Find the user by their email
    const userQuery = 'SELECT * FROM researchers WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rowCount === 0) {
      // User not found
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // 2. Check if the provided 'password' (researcher_id) matches their actual researcher_id
    if (user.researcher_id !== researcher_id_password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. User is authenticated. Now, check if they are an admin (an HOD)
    let userRole = 'researcher'; // Default role
    const hodQuery = 'SELECT * FROM departments WHERE hod = $1';
    const hodResult = await pool.query(hodQuery, [user.researcher_id]);

    if (hodResult.rowCount > 0) {
      userRole = 'admin'; // This user is an HOD, so make them an admin
    }

    // 4. Create a token to store their login info
    const token = jwt.sign(
      {
        id: user.researcher_id,
        role: userRole,
        name: user.name
      },
      'your_secret_key_12345', // <-- Replace with a real, random secret key
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // 5. Send the token and user info back to the front-end
    res.json({ token, role: userRole, name: user.name });

  } catch (err) {
    console.error('Login error:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Fetch all agencies (for cards) ---
app.get('/api/agencies/details', async (req, res) => {
  try {
    const query = `
      SELECT agency_id, name, type, contact 
      FROM Agencies
      ORDER BY name;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Fetch grants for a SINGLE agency (for modal) ---
app.get('/api/agencies/:id/grants', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT grant_id, title, amount, year 
      FROM Grants 
      WHERE given_by = $1
      ORDER BY year DESC;
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Fetch all equipment details (for cards) ---
app.get('/api/equipment/details', async (req, res) => {
  try {
    const query = `
      SELECT 
        e.equipment_id, 
        e.equipment_name, 
        e.model, 
        d.department_name AS managed_by_dept
      FROM 
        Equipments e
      LEFT JOIN 
        Departments d ON e.managed_by = d.department_id
      ORDER BY 
        e.equipment_name;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/researchers/me', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT r.name, r.email, r.position, d.department_name 
      FROM researchers r
      LEFT JOIN Departments d ON r.department = d.department_id
      WHERE r.researcher_id = $1
    `;
    const result = await pool.query(query, [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching researcher details:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// 3. GET: Project Funding (for modal)
app.get('/api/projects/:id/funding', verifyToken, async (req, res) => {
  try {

    const query = `
      SELECT g.title, f.amount FROM Funded_By f
      JOIN Grants g ON f.grant_id = g.grant_id
      WHERE f.project_id = $1
    `;
    const result = await pool.query(query, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching project funding:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. GET: "My Publications" (for publication tiles)
app.get('/api/publications/my-publications', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT p.* FROM Publications p
      JOIN Authors a ON p.publication_id = a.publication_id
      WHERE a.researcher_id = $1
    `;
    const result = await pool.query(query, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching my publications:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. PUT: Update Publication (for editable fields)
app.put('/api/publications/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, journal, publication_date, doi } = req.body;

    const query = `
      UPDATE Publications
      SET title = $1, journal = $2, publication_date = $3, doi = $4
      WHERE publication_id = $5
      RETURNING *
    `;
    const result = await pool.query(query, [title, journal, publication_date, doi, id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating publication:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. GET: "My Collaborators" (for collaborator tiles)
app.get('/api/researchers/my-collaborators', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT r.researcher_id, r.name, r.email, d.department_name 
      FROM researchers r
      LEFT JOIN Departments d ON r.department = d.department_id
      JOIN Members m ON r.researcher_id = m.researcher_id
      WHERE m.project_id IN (
        SELECT project_id FROM Members WHERE researcher_id = $1
      ) AND r.researcher_id != $1
    `;
    const result = await pool.query(query, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching collaborators:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Lists for researcher filters (unprotected) ---
app.get('/api/researchers/filters', async (req, res) => {
  try {
    const deptQuery = `SELECT department_id, department_name FROM Departments ORDER BY department_name`;
    const posQuery = `SELECT DISTINCT position FROM researchers WHERE position IS NOT NULL ORDER BY position`;
    
    const [deptResult, posResult] = await Promise.all([
      pool.query(deptQuery),
      pool.query(posQuery)
    ]);

    res.json({
      departments: deptResult.rows,
      positions: posResult.rows.map(r => r.position) // Send as simple array
    });
  } catch (err) {
    console.error('Error fetching filters:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Filtered list of researchers (protected) ---
app.get('/api/researchers/detailed', verifyToken, async (req, res) => {
  try {
    const { department_id, position, collaboratorsOnly, name } = req.query; // Added 'name'
    const currentUserId = req.user.id;

    let queryParams = [];
    let whereClauses = [];

    // ... (Base query is the same)
    let query = `
      SELECT 
        r.researcher_id, r.name, r.email, r.position, r.department, d.department_name 
      FROM researchers r
      LEFT JOIN departments d ON r.department = d.department_id
    `;

    if (collaboratorsOnly === 'true') {
      // ... (Collaborator logic is the same)
      query += ` JOIN members m ON r.researcher_id = m.researcher_id `;
      queryParams.push(currentUserId);
      whereClauses.push(`m.project_id IN (SELECT project_id FROM members WHERE researcher_id = $${queryParams.length})`);
      queryParams.push(currentUserId);
      whereClauses.push(`r.researcher_id != $${queryParams.length}`);
    }

    if (department_id) {
      queryParams.push(department_id);
      whereClauses.push(`d.department_id = $${queryParams.length}`);
    }
    if (position) {
      queryParams.push(position);
      whereClauses.push(`r.position = $${queryParams.length}`);
    }
    
    // --- ADDED THIS BLOCK ---
    if (name) {
      queryParams.push(`%${name}%`); // Add wildcards for partial matching
      whereClauses.push(`r.name ILIKE $${queryParams.length}`); // ILIKE is case-insensitive
    }
    // --- END OF ADDED BLOCK ---

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    
    query += " GROUP BY r.researcher_id, d.department_name ORDER BY r.name;";
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);

  } catch (err) {
    console.error('Error fetching detailed researchers:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/researchers/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const { id } = req.params;
    const { name, email, position, department } = req.body; // 'department' is the ID, e.g., 'D001'

    const query = `
      UPDATE researchers
      SET name = $1, email = $2, position = $3, department = $4
      WHERE researcher_id = $5
      RETURNING *
    `;
    const result = await pool.query(query, [name, email, position, department, id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating researcher:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- DELETE: Delete a researcher ---
app.delete('/api/researchers/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const { id } = req.params;
    // Your DB schema uses ON DELETE CASCADE/SET NULL, so this is safe.
    await pool.query('DELETE FROM researchers WHERE researcher_id = $1', [id]);
    res.status(200).json({ message: 'Researcher deleted successfully' });
  } catch (err) {
    console.error('Error deleting researcher:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Get the next available Publication ID ---
app.get('/api/publications/next-id', verifyToken, async (req, res) => {
  try {
    // This query correctly sorts by the number part of the ID
    const query = `
      SELECT publication_id FROM publications 
      ORDER BY CAST(SUBSTRING(publication_id FROM 4) AS INTEGER) DESC
      LIMIT 1
    `;
    const result = await pool.query(query);
    
    let nextId = 'PUB01'; // Default if table is empty
    if (result.rowCount > 0) {
      const lastId = result.rows[0].publication_id; // e.g., "P005"
      const lastNum = parseInt(lastId.substring(3)); // 5
      nextId = 'PUB' + String(lastNum + 1).padStart(2, '0'); // "P006"
    }
    res.json({ nextId });
  } catch (err) {
    console.error('Error fetching next ID:', err.stack);
          res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Search for researchers (for author autocomplete) ---
app.get('/api/researchers/search', verifyToken, async (req, res) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm || searchTerm.length < 4) {
      return res.json([]); // Don't search if query is too short
    }
    
    const query = `
      SELECT researcher_id, name, email FROM researchers
      WHERE name ILIKE $1 OR email ILIKE $1
      LIMIT 10
    `;
    // ILIKE is case-insensitive
    const result = await pool.query(query, [`%${searchTerm}%`]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error searching researchers:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- POST: Create a new publication (Full Transaction) ---
app.post('/api/publications/create', verifyToken, async (req, res) => {
  // This must be a transaction
  const client = await pool.connect();
  try {
    const { 
      publication_id, title, journal, publication_date, doi, 
      project_ids, // Array of project_id strings
      authors // Array of { id: researcher_id, order: number }
    } = req.body;

    // 1. Start the transaction
    await client.query('BEGIN');

    // 2. Insert into "Publications" table
    const pubQuery = `
      INSERT INTO Publications (publication_id, title, journal, publication_date, doi)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await client.query(pubQuery, [publication_id, title, journal, publication_date, doi]);

    // 3. Insert into "Result_in" table (for projects)
    // We use a loop to add all selected projects
    for (const project_id of project_ids) {
      const resultInQuery = `
        INSERT INTO Result_in (project_id, publication_id) VALUES ($1, $2)
      `;
      await client.query(resultInQuery, [project_id, publication_id]);
    }

    // 4. Insert into "Authors" table
    // The logged-in user is automatically added as the first author
    const firstAuthorQuery = `
      INSERT INTO Authors (publication_id, researcher_id, re_order)
      VALUES ($1, $2, 1)
    `;
    await client.query(firstAuthorQuery, [publication_id, req.user.id]);
    
    // Add other authors
    for (const author of authors) {
      const authorQuery = `
        INSERT INTO Authors (publication_id, researcher_id, re_order)
        VALUES ($1, $2, $3)
      `;
      // author.order + 2 because the logged-in user is #1
      await client.query(authorQuery, [publication_id, author.id, author.order + 2]);
    }

    // 5. Commit the transaction
    await client.query('COMMIT');
    res.status(201).json({ message: 'Publication created successfully' });

  } catch (err) {
    // 6. If anything fails, roll back
    await client.query('ROLLBACK');
    console.error('Error in create publication transaction:', err.stack);
    res.status(500).json({ error: 'Transaction failed' });
  } finally {
    // 7. Release the client back to the pool
    client.release();
  }
});

// --- GET: Fetch all logs for the researcher's dashboard ---
app.get('/api/usage/my-logs', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        u.equipment_id, u.project_id, u.researcher_id,
        e.equipment_name,
        p.title AS project_title,
        r.name AS researcher_name,
        u.start_timestamp,
        u.end_timestamp
      FROM Usage u
      JOIN equipments e ON u.equipment_id = e.equipment_id
      JOIN Research_Projects p ON u.project_id = p.project_id
      JOIN researchers r ON u.researcher_id = r.researcher_id
      WHERE 
        u.researcher_id = $1 
        OR u.project_id IN (
          SELECT project_id FROM members WHERE researcher_id = $1
        )
      ORDER BY u.start_timestamp DESC;
    `;
    const result = await pool.query(query, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching usage logs:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- PUT: Return a piece of equipment (set end_timestamp) ---
app.put('/api/usage/return', verifyToken, async (req, res) => {
  try {
    const { equipment_id, project_id, researcher_id } = req.body;
    
    // We must check if the person returning is the one who checked it out
    if (researcher_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only return your own equipment.' });
    }

    const query = `
      UPDATE Usage
      SET end_timestamp = NOW()
      WHERE equipment_id = $1 AND project_id = $2 AND researcher_id = $3 AND end_timestamp IS NULL
      RETURNING *;
    `;
    const result = await pool.query(query, [equipment_id, project_id, researcher_id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Active log not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error returning equipment:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Search for equipment (for autocomplete) ---
app.get('/api/equipment/search', verifyToken, async (req, res) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm || searchTerm.length < 3) { // 3 chars for equipment
      return res.json([]);
    }
    
    const query = `
      SELECT equipment_id, equipment_name, model FROM equipments
      WHERE equipment_name ILIKE $1 OR model ILIKE $1
      LIMIT 10
    `;
    const result = await pool.query(query, [`%${searchTerm}%`]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error searching equipment:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- POST: Create a new log (Checkout equipment) ---
app.post('/api/usage/create-checkout', verifyToken, async (req, res) => {
  try {
    const { equipment_id, project_id } = req.body;
    const researcher_id = req.user.id; // Logged-in user
    
    const query = `
      INSERT INTO Usage (equipment_id, researcher_id, project_id, start_timestamp, end_timestamp)
      VALUES ($1, $2, $3, NOW(), NULL)
      RETURNING *;
    `;
    const result = await pool.query(query, [equipment_id, researcher_id, project_id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating checkout:', err.stack);
    // Check for primary key violation
    if (err.code === '23505') { 
       return res.status(409).json({ error: 'This equipment is already logged for this project by this user.' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// --- GET: Fetch all usage logs (Admin, with filters) ---
app.get('/api/usage/all-logs', verifyToken, async (req, res) => {
  // 1. Check if user is an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }

  try {
    const { showAll, researcherId, projectId, equipmentId } = req.query;
    
    let queryParams = [];
    let whereClauses = [];

    // 2. Base Query
    let query = `
      SELECT 
        u.equipment_id, u.project_id, u.researcher_id,
        e.equipment_name,
        p.title AS project_title,
        r.name AS researcher_name,
        u.start_timestamp,
        u.end_timestamp
      FROM Usage u
      LEFT JOIN equipments e ON u.equipment_id = e.equipment_id
      LEFT JOIN Research_Projects p ON u.project_id = p.project_id
      LEFT JOIN researchers r ON u.researcher_id = r.researcher_id
    `;

    // 3. Handle Default View (Admin's Department)
    if (showAll !== 'true') {
      // Find the admin's (HOD's) department
      const deptQuery = `SELECT department_id FROM departments WHERE hod = $1`;
 
      const deptResult = await pool.query(deptQuery, [req.user.id]);
      
      if (deptResult.rowCount > 0) {
        const deptId = deptResult.rows[0].department_id;
        queryParams.push(deptId);
        whereClauses.push(`e.managed_by = $${queryParams.length}`);
      } else {
        // This HOD is not assigned to a department, so show no logs.
        whereClauses.push('1 = 0'); // Always false
      }
    }

    // 4. Add Optional Filters
    if (researcherId) {
      queryParams.push(researcherId);
      whereClauses.push(`u.researcher_id = $${queryParams.length}`);
    }
    if (projectId) {
      queryParams.push(projectId);
      whereClauses.push(`u.project_id = $${queryParams.length}`);
    }
    if (equipmentId) {
      queryParams.push(equipmentId);
      whereClauses.push(`u.equipment_id = $${queryParams.length}`);
    }

    // 5. Combine query
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    query += ' ORDER BY u.start_timestamp DESC;';

    const result = await pool.query(query, queryParams);
    res.json(result.rows);

  } catch (err) {
    console.error('Error fetching all logs:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Get the next available Agency ID ---
app.get('/api/agencies/next-id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const query = `
      SELECT agency_id FROM agencies 
      WHERE agency_id ~ '^A[0-9]+$' -- Filter for IDs like 'A001', 'A123'
      ORDER BY CAST(SUBSTRING(agency_id FROM 2) AS INTEGER) DESC
      LIMIT 1
    `;
    const result = await pool.query(query);
    
    let nextId = 'A001'; // Default if table is empty
    if (result.rowCount > 0) {
      const lastId = result.rows[0].agency_id; // e.g., "A005"
      const lastNum = parseInt(lastId.substring(1)); // 5
      nextId = 'A' + String(lastNum + 1).padStart(3, '0'); // "A006"
    }
    res.json({ nextId });
  } catch (err) {
    console.error('Error fetching next ID:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- POST: Create a new agency ---
app.post('/api/agencies/create', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const { agency_id, name, type, contact } = req.body;
    const query = `
      INSERT INTO agencies (agency_id, name, type, contact)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [agency_id, name, type, contact]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating agency:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- PUT: Update an agency ---
app.put('/api/agencies/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const { id } = req.params;
    const { name, type, contact } = req.body;
    const query = `
      UPDATE agencies 
      SET name = $1, type = $2, contact = $3
      WHERE agency_id = $4
      RETURNING *
    `;
    const result = await pool.query(query, [name, type, contact, id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating agency:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// --- GET: Search for grants (for autocomplete) ---
app.get('/api/grants/search', verifyToken, async (req, res) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm || searchTerm.length < 3) {
      return res.json([]);
    }
    const query = `
      SELECT grant_id, title FROM grants
      WHERE title ILIKE $1
      LIMIT 10
    `;
    const result = await pool.query(query, [`%${searchTerm}%`]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error searching grants:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- POST: Create a new project (Full Transaction) ---
app.post('/api/projects/create', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });

  const client = await pool.connect();
  try {
    const { 
      project_id, title, abstract, start_date, end_date, 
      leader_id,
      members,
      grants
    } = req.body;

    if (!leader_id) {
      return res.status(400).json({ error: 'A Project Leader is required.' });
    }

    await client.query('BEGIN');

    // 2. Insert into "research_projects" (FIX: 'research_projects' no quotes)
    const projectQuery = `
      INSERT INTO research_projects (project_id, title, abstract, start_date, end_date, leader_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await client.query(projectQuery, [project_id, title, abstract, start_date, end_date, leader_id]);

    // 3. Insert Leader into "members" (FIX: 'members' no quotes)
    const leaderQuery = `
      INSERT INTO members (project_id, researcher_id, role)
      VALUES ($1, $2, 'Project Leader')
    `;
    await client.query(leaderQuery, [project_id, leader_id]);

    // 4. Insert other members (FIX: 'members' no quotes)
    for (const member of members) {
      const memberQuery = `
        INSERT INTO members (project_id, researcher_id, role) VALUES ($1, $2, $3)
      `;
      await client.query(memberQuery, [project_id, member.id, member.role]);
    }

    // 5. Insert into "funded_by" (FIX: 'funded_by' no quotes)
    for (const grant of grants) {
      const grantQuery = `
        INSERT INTO funded_by (project_id, grant_id, amount) VALUES ($1, $2, $3)
      `;
      await client.query(grantQuery, [project_id, grant.id, grant.amount]);
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Project created successfully' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in create project transaction:', err.stack);
    res.status(500).json({ error: 'Transaction failed' });
  } finally {
    client.release();
  }
});

app.get('/api/projects/:id/manage-details', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const { id } = req.params;
    
    // 1. Get Project Info (FIX: 'research_projects' no quotes)
    const projectQuery = 'SELECT * FROM research_projects WHERE project_id = $1';
    
    // 2. Get Members (FIX: 'members' no quotes)
    const membersQuery = `
      SELECT r.researcher_id, r.name, m.role 
      FROM members m
      JOIN researchers r ON m.researcher_id = r.researcher_id
      WHERE m.project_id = $1 AND m.role != 'Project Leader'
    `;
    
    // 3. Get Grants (FIX: 'funded_by' and 'grants' no quotes)
    const grantsQuery = `
      SELECT g.grant_id, g.title, f.amount 
      FROM funded_by f
      JOIN grants g ON f.grant_id = g.grant_id
      WHERE f.project_id = $1
    `;

    const [projectRes, membersRes, grantsRes] = await Promise.all([
      pool.query(projectQuery, [id]),
      pool.query(membersQuery, [id]),
      pool.query(grantsQuery, [id])
    ]);

    if (projectRes.rowCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      project: projectRes.rows[0],
      members: membersRes.rows,
      grants: grantsRes.rows
    });
    
  } catch (err) {
    console.error('Error fetching manage details:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/projects/:id/update', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }

  const client = await pool.connect();

  try {
    const { id: project_id } = req.params;
    const {
      title,
      abstract,
      start_date,
      end_date,
      leader_id,
      members = [],
      grants = [],
    } = req.body;

    if (!project_id || !leader_id || !title) {
      return res.status(400).json({ error: 'Missing required fields (project_id, leader_id, title).' });
    }

    console.log('\n--- PROJECT UPDATE REQUEST ---');
    console.log('Project ID:', project_id);
    console.log('Leader ID:', leader_id);
    console.log('Members:', members);
    console.log('Grants:', grants);

    await client.query('BEGIN');

    // 1️⃣ Update main Research_Projects record
    const updateProjectQuery = `
      UPDATE research_projects
      SET title = $1, abstract = $2, start_date = $3, end_date = $4, leader_id = $5
      WHERE project_id = $6
      RETURNING project_id;
    `;
    const projectResult = await client.query(updateProjectQuery, [
      title, abstract, start_date, end_date, leader_id, project_id,
    ]);

    if (projectResult.rowCount === 0) {
      throw new Error('Project not found.');
    }

    // 2️⃣ Remove all old members
    await client.query('DELETE FROM members WHERE project_id = $1', [project_id]);

    // 3️⃣ Add new leader
    const insertLeaderQuery = `
      INSERT INTO members (project_id, researcher_id, role)
      VALUES ($1, $2, 'Project Leader');
    `;
    await client.query(insertLeaderQuery, [project_id, leader_id]);

    // 4️⃣ Add new other members (excluding the leader to avoid duplicate key error)
    for (const member of members) {
      if (!member.id || !member.role) continue;
      if (member.id === leader_id) continue; // ✅ Skip the leader to avoid duplicate (project_id, researcher_id)

      const insertMemberQuery = `
        INSERT INTO members (project_id, researcher_id, role)
        VALUES ($1, $2, $3);
      `;
      await client.query(insertMemberQuery, [project_id, member.id, member.role]);
    }

    // 5️⃣ Delete old grants
    await client.query('DELETE FROM funded_by WHERE project_id = $1', [project_id]);

    // 6️⃣ Insert new grants
    for (const grant of grants) {
      if (!grant.id || !grant.amount) continue;
      const insertGrantQuery = `
        INSERT INTO funded_by (project_id, grant_id, amount)
        VALUES ($1, $2, $3);
      `;
      await client.query(insertGrantQuery, [project_id, grant.id, grant.amount]);
    }

    await client.query('COMMIT');
    res.status(200).json({ message: '✅ Project updated successfully.' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error in update project transaction:', err.message);
    res.status(500).json({ error: err.message || 'Transaction failed.' });
  } finally {
    client.release();
  }
});



// --- GET: Fetch details for a SINGLE project ---
app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params; // Get the ID from the URL
    const result = await pool.query('SELECT * FROM Research_Projects WHERE project_id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(result.rows[0]); // Send back the first (and only) row
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Get ALL grants (for manage page) ---
app.get('/api/grants/all', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const query = `SELECT * FROM grants ORDER BY year DESC`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all grants:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- GET: Get the next available Grant ID ---
app.get('/api/grants/next-id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const query = `
      SELECT grant_id FROM grants 
      WHERE grant_id ~ '^G[0-9]+$' -- Filter for IDs like 'G001', 'G123'
      ORDER BY CAST(SUBSTRING(grant_id FROM 2) AS INTEGER) DESC
      LIMIT 1
    `;
    const result = await pool.query(query);
    
    let nextId = 'G001'; // Default if table is empty
    if (result.rowCount > 0) {
      const lastId = result.rows[0].grant_id; // e.g., "G005"
      const lastNum = parseInt(lastId.substring(1)); // 5
      nextId = 'G' + String(lastNum + 1).padStart(3, '0'); // "G006"
    }
    res.json({ nextId });
  } catch (err) {
    console.error('Error fetching next ID:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- POST: Create a new grant ---
app.post('/api/grants/create', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const { grant_id, title, amount, year, given_by } = req.body;
    const query = `
      INSERT INTO grants (grant_id, title, amount, year, given_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [grant_id, title, amount, year, given_by]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating grant:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- PUT: Update a grant ---
app.put('/api/grants/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const { id } = req.params;
    const { title, amount, year, given_by } = req.body;
    const query = `
      UPDATE grants 
      SET title = $1, amount = $2, year = $3, given_by = $4
      WHERE grant_id = $5
      RETURNING *
    `;
    const result = await pool.query(query, [title, amount, year, given_by, id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating grant:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- DELETE: Delete a grant ---
app.delete('/api/grants/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  try {
    const { id } = req.params;
    // Check if grant is linked to a project
    const checkQuery = `SELECT * FROM Funded_By WHERE grant_id = $1`;
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rowCount > 0) {
      return res.status(409).json({ error: 'Cannot delete: This grant is funding one or more projects.' });
    }

    // If not linked, proceed with delete
    await pool.query('DELETE FROM grants WHERE grant_id = $1', [id]);
    res.status(200).json({ message: 'Grant deleted successfully' });
  } catch (err) {
    console.error('Error deleting grant:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});