ffmpeg -y -hide_banner -loglevel error -i db/Fatboy_clarinet/46.mp3 -i db/Fatboy_string_ensemble_1/46.mp3 -i db/Fatboy_string_ensemble_1/46.mp3 \
-i db/Fatboy_string_ensemble_1/34.mp3 -i db/Fatboy_string_ensemble_1/22.mp3 -i db/Fatboy_string_ensemble_1/22.mp3 \
-filter_complex "[0:a]adelay=30|30[d0],[1:a]adelay=30|30[d1],[d0][d1]amix=inputs=6:dropout_transition=0,dynaudnorm,volumedetect" -ac 2 -ar 44100  -f mp3 - |ffplay -i pipe:0
