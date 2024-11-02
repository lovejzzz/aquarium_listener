document.addEventListener('DOMContentLoaded', function() {
    const audio = document.getElementById('audio');
    const audioSource = document.getElementById('audio-source');
    const disc = document.getElementById('disc');
    let rotationAngle = 0; // Track the current rotation angle
    let isRotating = false; // Flag to track rotation state
    const rotationIncrement = 0.6; // Set a constant increment for rotation speed
    let currentTrackIndex = 0;

    // Initialize playlistTracks as an array of playlist track elements
    let playlistTracks = Array.from(document.querySelectorAll('.playlist-track'));

    // Function to shuffle the playlist
    function shufflePlaylist() {
        for (let i = playlistTracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playlistTracks[i], playlistTracks[j]] = [playlistTracks[j], playlistTracks[i]]; // Swap elements
        }
        const playListContainer = document.querySelector('.play-list');
        playListContainer.innerHTML = ''; // Clear existing playlist
        playlistTracks.forEach(track => playListContainer.appendChild(track.parentElement)); // Append shuffled tracks
    }

    shufflePlaylist(); // Shuffle the playlist on load

    // Function to update current track highlight
    function updateCurrentTrackHighlight() {
        // Remove 'current-track' class from all tracks
        playlistTracks.forEach(track => {
            track.classList.remove('current-track');
        });

        // Add 'current-track' class to the currently playing track
        const currentTrack = playlistTracks[currentTrackIndex];
        if (currentTrack) {
            currentTrack.classList.add('current-track');
        }
    }

    // Function to play the next track
    function playNextTrack() {
        currentTrackIndex = (currentTrackIndex + 1) % playlistTracks.length; // Loop back to start if at end
        audioSource.src = playlistTracks[currentTrackIndex].parentElement.getAttribute('data-track');
        audio.load();
        audio.play();
        if (!isRotating) {
            isRotating = true;
            rotateDisc();
        }
        updateCurrentTrackHighlight(); // Update the highlight
    }

    // Add ended event listener for auto-play next song
    audio.addEventListener('ended', playNextTrack);

    // Play the first song from the shuffled playlist
    audioSource.src = playlistTracks[0].parentElement.getAttribute('data-track');
    audio.load();
    updateCurrentTrackHighlight(); // Update the highlight for the first track

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

    // Add click event listeners to playlist tracks
    playlistTracks.forEach((track, index) => {
        track.addEventListener('click', function(e) {
            e.preventDefault();
            currentTrackIndex = index; // Update current track index
            audioSource.src = this.parentElement.getAttribute('data-track');
            audio.load();
            audio.play();
            if (!isRotating) { // Start rotation only if not already rotating
                isRotating = true; // Set rotation flag
                rotateDisc(); // Start rotation
            }
            updateCurrentTrackHighlight(); // Update the highlight
        });
    });

    // Disable right-click context menu on the entire page
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    }, true);

});