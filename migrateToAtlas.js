const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://localhost:27017/easyshop';
const ATLAS_URI = process.env.ATLAS_URI;

if (!ATLAS_URI) {
    console.error('Please set ATLAS_URI environment variable');
    process.exit(1);
}

async function migrate() {
    // Connect to local
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Connected to local MongoDB');

    // Connect to Atlas
    const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✅ Connected to MongoDB Atlas');

    const localDb = localConn.db;
    const atlasDb = atlasConn.db;

    // Get all collections
    const collections = await localDb.listCollections().toArray();
    console.log(`\nFound ${collections.length} collections to migrate\n`);

    for (const colInfo of collections) {
        const name = colInfo.name;
        const docs = await localDb.collection(name).find({}).toArray();
        console.log(`📦 ${name}: ${docs.length} documents`);

        if (docs.length > 0) {
            // Drop existing collection on Atlas (if any) to avoid duplicates
            try { await atlasDb.collection(name).drop(); } catch (e) { /* doesn't exist yet */ }
            await atlasDb.collection(name).insertMany(docs);
            console.log(`   ✅ Migrated ${docs.length} documents`);
        } else {
            console.log(`   ⏭️  Skipped (empty)`);
        }
    }

    console.log('\n🎉 Migration complete!');
    await localConn.close();
    await atlasConn.close();
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});
