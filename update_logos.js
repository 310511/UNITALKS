const sharp = require('sharp');
const path = require('path');

// Spotify green color
const targetColor = '#1DB954';

// List of logos to process
const logoFiles = [
    'public/assets/logos/logo.png',
    'public/assets/logos/f.png',
    'public/assets/logos/log.png',
    'public/assets/logos/f2.png',
    'build/assets/logos/logo.png',
    'build/assets/logos/f.png',
    'build/assets/logos/log.png',
    'build/assets/logos/lo.png'
];

async function updateLogoColor(inputPath) {
    try {
        // Load the image
        const image = sharp(inputPath);
        
        // Create color overlay
        await image
            .tint(targetColor)  // Apply the green tint
            .toFile(inputPath + '.new');
            
        // Replace original with new version
        require('fs').renameSync(inputPath + '.new', inputPath);
        
        console.log(`Updated ${inputPath} to Spotify green`);
    } catch (error) {
        console.error(`Error processing ${inputPath}:`, error);
    }
}

// Process all logo files
logoFiles.forEach(logoPath => {
    const fullPath = path.join(__dirname, 'client', logoPath);
    updateLogoColor(fullPath);
});


