document.addEventListener('DOMContentLoaded', function() {
    const audio = document.getElementById('audio');
    const audioSource = document.getElementById('audio-source');
    const playlistTracks = document.querySelectorAll('.playlist-track');
    const disc = document.getElementById('disc');
    let currentTrackIndex = 0;
    let rotationAngle = 0; // Track the current rotation angle
    let isRotating = false; // Flag to track rotation state
    const rotationIncrement = 0.6; // Set a constant increment for rotation speed

    // Function to shuffle the playlist
    function shufflePlaylist() {
        const playlist = Array.from(playlistTracks);
        for (let i = playlist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playlist[i], playlist[j]] = [playlist[j], playlist[i]]; // Swap elements
        }
        const playListContainer = document.querySelector('.play-list');
        playListContainer.innerHTML = ''; // Clear existing playlist
        playlist.forEach(track => playListContainer.appendChild(track.parentElement)); // Append shuffled tracks
        return playlist; // Return the shuffled playlist
    }

    const shuffledPlaylist = shufflePlaylist(); // Shuffle the playlist on load

    // Play the first song from the shuffled playlist
    audioSource.src = shuffledPlaylist[0].parentElement.getAttribute('data-track');
    audio.load();

    // Disc click event to play/pause
    disc.addEventListener('click', function() {
        if (audio.paused) {
            audio.play();
            if (!isRotating) { // Start rotation only if not already rotating
                isRotating = true; // Set rotation flag
                rotateDisc(); // Start rotation
            }
        } else {
            audio.pause();
            isRotating = false; // Stop rotation
            disc.style.transform = `rotate(${rotationAngle}deg)`; // Keep current angle
        }
    });

    function rotateDisc() {
        if (isRotating) {
            rotationAngle += rotationIncrement; // Use constant increment for rotation speed
            disc.style.transform = `rotate(${rotationAngle}deg)`; // Apply rotation
            requestAnimationFrame(rotateDisc); // Continue rotating while playing
        }
    }

    playlistTracks.forEach(track => {
        track.addEventListener('click', function(e) {
            e.preventDefault();
            currentTrackIndex = Array.from(playlistTracks).indexOf(track); // Update current track index
            audioSource.src = this.parentElement.getAttribute('data-track');
            audio.load();
            audio.play();
            rotationAngle = rotationAngle; // Maintain current rotation angle
            if (!isRotating) { // Start rotation only if not already rotating
                isRotating = true; // Set rotation flag
                rotateDisc(); // Start rotation
            }
        });
    });
});