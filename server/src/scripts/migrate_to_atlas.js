import 'dotenv/config';
import { MongoClient } from 'mongodb';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/sri-balaji-store';
const ATLAS_URI =
  process.env.MONGODB_URI_ATLAS ||
  'mongodb+srv://manikantavuppala124:manivuppala124@cluster0.d7m6k.mongodb.net/sri-balaji-store?retryWrites=true&w=majority&appName=Cluster0';

const runMigration = async () => {
  console.log('======================================================');
  console.log('Sri Balaji Store: Migrating Local MongoDB -> MongoDB Atlas');
  console.log('======================================================');
  console.log('Source:', LOCAL_URI);
  console.log('Target:', ATLAS_URI.replace(/:([^:@]+)@/, ':****@'));

  const localClient = new MongoClient(LOCAL_URI);
  const atlasClient = new MongoClient(ATLAS_URI);

  console.log('\nConnecting to local MongoDB...');
  await localClient.connect();
  console.log('Connected to local MongoDB.');

  console.log('Connecting to MongoDB Atlas...');
  await atlasClient.connect();
  console.log('Connected to MongoDB Atlas.');

  const localDb = localClient.db('sri-balaji-store');
  const atlasDb = atlasClient.db('sri-balaji-store');

  const collections = await localDb.listCollections().toArray();
  console.log(`\nFound ${collections.length} collections to migrate:`);
  collections.forEach((c) => console.log(`  - ${c.name}`));

  for (const col of collections) {
    const name = col.name;
    if (name.startsWith('system.')) continue;

    const sourceCol = localDb.collection(name);
    const targetCol = atlasDb.collection(name);

    const docs = await sourceCol.find({}).toArray();
    console.log(`\n[${name}] Found ${docs.length} documents.`);

    if (docs.length > 0) {
      await targetCol.deleteMany({});
      const result = await targetCol.insertMany(docs);
      console.log(`[${name}] Migrated ${result.insertedCount} documents.`);
    }

    // Migrate indexes
    try {
      const indexes = await sourceCol.indexes();
      for (const idx of indexes) {
        if (idx.name === '_id_') continue;
        const options = { name: idx.name };
        if (idx.unique) options.unique = true;
        if (idx.sparse) options.sparse = true;
        try {
          await targetCol.createIndex(idx.key, options);
          console.log(`[${name}] Index recreated: ${idx.name}`);
        } catch (err) {
          // Index might already exist
        }
      }
    } catch (err) {
      console.warn(`[${name}] Could not copy indexes:`, err.message);
    }
  }

  console.log('\n======================================================');
  console.log('Migration Complete! Verifying Atlas Collections...');
  console.log('======================================================');

  const atlasCollections = await atlasDb.listCollections().toArray();
  for (const c of atlasCollections) {
    const count = await atlasDb.collection(c.name).countDocuments();
    console.log(`Atlas collection: ${c.name} -> ${count} documents`);
  }

  await localClient.close();
  await atlasClient.close();
  console.log('\nBoth database connections closed. Migration successful!');
};

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
