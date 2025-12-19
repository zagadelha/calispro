const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/assets/exercises/exercises_v1_1.json', 'utf8'));

const needsGif = [];

data.exercises.forEach(ex => {
    const mediaUrl = ex.media?.url || '';
    const needsUpdate = !mediaUrl ||
        mediaUrl.includes('placeholder') ||
        mediaUrl.includes('giphy.com/explore') ||
        mediaUrl === '';

    if (needsUpdate) {
        needsGif.push({
            name: ex.name,
            id: ex.id,
            currentUrl: mediaUrl || 'NENHUMA',
            fallback: ex.fallback_media_search_url || 'N/A'
        });
    }
});

console.log('EXERCÍCIOS QUE PRECISAM DE GIF:\n');
console.log('='.repeat(60));

needsGif.forEach((ex, i) => {
    console.log(`\n${i + 1}. ${ex.name}`);
    console.log(`   ID: ${ex.id}`);
    console.log(`   URL atual: ${ex.currentUrl}`);
    console.log(`   Buscar em: ${ex.fallback}`);
});

console.log('\n' + '='.repeat(60));
console.log(`TOTAL: ${needsGif.length} exercícios precisam de GIF`);
console.log('='.repeat(60));
