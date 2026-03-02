const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();
const BUCKET_NAME = process.env.BUCKET_NAME;
const SONGS_PREFIX = 'songs/';

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '3600');
}

functions.http('api', async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (!BUCKET_NAME) {
    return res.status(500).json({ error: 'BUCKET_NAME not configured' });
  }

  const bucket = storage.bucket(BUCKET_NAME);
  const path = req.path;

  try {
    // POST /songs - Create or update a song
    if (req.method === 'POST' && path === '/songs') {
      const song = req.body;

      if (!song || !song.id || !song.authorId) {
        return res.status(400).json({ error: 'id and authorId are required' });
      }

      const file = bucket.file(`${SONGS_PREFIX}${song.id}.json`);
      await file.save(JSON.stringify(song), {
        contentType: 'application/json',
        metadata: {
          metadata: {
            authorId: song.authorId,
            name: song.name || '',
            bpm: String(song.bpm || 120),
          },
        },
      });

      return res.status(201).json(song);
    }

    // GET /songs - List songs
    if (req.method === 'GET' && path === '/songs') {
      const { authorId, limit = '30' } = req.query;
      const [files] = await bucket.getFiles({ prefix: SONGS_PREFIX });

      let songs = [];
      for (const file of files) {
        if (!file.name.endsWith('.json')) continue;

        const meta = file.metadata;
        const customMeta = meta.metadata || {};

        // Filter by authorId if specified
        if (authorId && customMeta.authorId !== authorId) continue;

        songs.push({
          id: file.name.replace(SONGS_PREFIX, '').replace('.json', ''),
          authorId: customMeta.authorId || '',
          name: customMeta.name || '',
          bpm: parseInt(customMeta.bpm || '120', 10),
          createdAt: meta.timeCreated,
        });
      }

      // Sort newest first
      songs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Apply limit unless filtering by author (return all for own songs)
      if (!authorId) {
        songs = songs.slice(0, parseInt(limit, 10));
      }

      return res.json(songs);
    }

    // GET /songs/:id - Get a specific song
    const getMatch = path.match(/^\/songs\/([a-zA-Z0-9-]+)$/);
    if (req.method === 'GET' && getMatch) {
      const id = getMatch[1];
      const file = bucket.file(`${SONGS_PREFIX}${id}.json`);
      const [exists] = await file.exists();

      if (!exists) {
        return res.status(404).json({ error: 'Song not found' });
      }

      const [content] = await file.download();
      return res.json(JSON.parse(content.toString()));
    }

    // DELETE /songs/:id - Delete a song
    const deleteMatch = path.match(/^\/songs\/([a-zA-Z0-9-]+)$/);
    if (req.method === 'DELETE' && deleteMatch) {
      const id = deleteMatch[1];
      const file = bucket.file(`${SONGS_PREFIX}${id}.json`);

      try {
        await file.delete();
      } catch (e) {
        if (e.code !== 404) throw e;
      }

      return res.json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
