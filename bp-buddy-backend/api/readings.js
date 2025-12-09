import { BPDatabase } from '../lib/database.js';

const db = new BPDatabase();

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { method } = req;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    switch (method) {
      case 'GET':
        const { startDate, endDate, limit } = req.query;
        const readings = await db.getReadings(userId, {
          startDate,
          endDate,
          limit: limit ? parseInt(limit) : undefined
        });
        res.status(200).json({ readings });
        break;

      case 'POST':
        const { systolic, diastolic, pulse, notes, tags, timestamp } = req.body;
        
        if (!systolic || !diastolic) {
          return res.status(400).json({ error: 'Systolic and diastolic values are required' });
        }

        const newReading = await db.createReading(userId, {
          systolic: parseInt(systolic),
          diastolic: parseInt(diastolic),
          pulse: pulse ? parseInt(pulse) : null,
          notes,
          tags,
          timestamp: timestamp ? new Date(timestamp) : undefined
        });

        res.status(201).json({ reading: newReading });
        break;

      case 'PUT':
        const { readingId } = req.query;
        if (!readingId) {
          return res.status(400).json({ error: 'readingId is required for updates' });
        }

        const updates = {};
        if (req.body.systolic) updates.systolic = parseInt(req.body.systolic);
        if (req.body.diastolic) updates.diastolic = parseInt(req.body.diastolic);
        if (req.body.pulse) updates.pulse = parseInt(req.body.pulse);
        if (req.body.notes !== undefined) updates.notes = req.body.notes;
        if (req.body.tags) updates.tags = req.body.tags;

        const updated = await db.updateReading(readingId, updates);
        if (updated) {
          res.status(200).json({ message: 'Reading updated successfully' });
        } else {
          res.status(404).json({ error: 'Reading not found' });
        }
        break;

      case 'DELETE':
        const { readingId: deleteId } = req.query;
        if (!deleteId) {
          return res.status(400).json({ error: 'readingId is required for deletion' });
        }

        const deleted = await db.deleteReading(deleteId);
        if (deleted) {
          res.status(200).json({ message: 'Reading deleted successfully' });
        } else {
          res.status(404).json({ error: 'Reading not found' });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
