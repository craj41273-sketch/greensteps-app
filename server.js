import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NHOST_URL = process.env.NHOST_URL;
const ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large JSON payloads
app.use(express.static('public')); // Serve frontend files from 'public' folder

// === SECURE API ENDPOINTS ===

// 1. Sync (Upload) data to Nhost
app.post('/api/sync', async (req, res) => {
  try {
    const { recordId, data } = req.body;
    
    const mutation = `
      mutation InsertState($id: uuid!, $data: jsonb!) {
        insert_app_state_one(object: {id: $id, data: $data}, on_conflict: {constraint: app_state_pkey, update_columns: data}) {
          id
        }
      }
    `;

    const response = await fetch(`${NHOST_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': ADMIN_SECRET // Secret is used safely here!
      },
      body: JSON.stringify({ query: mutation, variables: { id: recordId, data } })
    });

    const result = await response.json();
    if (result.errors) throw new Error(result.errors[0].message);
    
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Sync Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Fetch (Download) data from Nhost
app.post('/api/fetch', async (req, res) => {
  try {
    const { recordId } = req.body;

    const query = `
      query GetState($id: uuid!) {
        app_state_by_pk(id: $id) {
          data
        }
      }
    `;

    const response = await fetch(`${NHOST_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': ADMIN_SECRET
      },
      body: JSON.stringify({ query, variables: { id: recordId } })
    });

    const result = await response.json();
    if (result.errors) throw new Error(result.errors[0].message);
    
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Fetch Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`GreenSteps server running at http://localhost:${PORT}`);
});
