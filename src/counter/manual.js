        const manual = { count: 0, target: null, elapsed: 0, startedAt: null, timer: null, automatic: false, calibrationStart: 0, interval: null, nextAt: null };
        const manualClock = document.getElementById('manualClock');
        const manualTap = document.getElementById('manualTap');
        const manualCount = document.getElementById('manualCount');
        const manualStart = document.getElementById('manualStart');
        const manualUndo = document.getElementById('manualUndo');

        function manualElapsed() {
            return manual.elapsed + (manual.startedAt === null ? 0 : performance.now() - manual.startedAt);
        }

        function announceSeries() {
            playSound(800, 'sine', 0.08);
            speak(String(manual.count), true);
        }

        function renderManual() {
            let elapsed = manualElapsed();
            const advanced = advanceSeries(manual, elapsed);
            if (advanced) announceSeries();
            if (seriesGoalReached(manual) && manual.startedAt !== null) {
                // Stop without recursively rendering; use the final deadline, even after a delayed tick.
                manual.elapsed = advanced ? manual.nextAt - manual.interval : elapsed;
                manual.startedAt = null;
                clearInterval(manual.timer); manual.timer = null;
                releaseWakeLock(); lucide.createIcons();
                if(typeof recordManualCompletion==='function')recordManualCompletion();
                celebrateFitTempo(`${manual.count} ${manual.count===1?'série':'séries'} · ${seriesDurationText(manual.elapsed)}`);
            }
            elapsed = manualElapsed();
            const seconds = Math.floor(elapsed / 1000);
            manualClock.textContent = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
                .map(value => String(value).padStart(2, '0')).join(':');
            paintSeriesProgress(manual, elapsed); paintSeriesGoal(manual, elapsed); manualCount.textContent = manual.count; manualTap.style.setProperty('--series-digits', String(String(manual.count).length));
            document.getElementById('manualStartLabel').textContent = seriesGoalReached(manual) ? 'Concluído' : manual.startedAt !== null ? 'Pausar' : manual.elapsed > 0 ? 'Retomar' : 'Iniciar';
            manualStart.title = manual.startedAt !== null ? 'Pausar cronómetro' : 'Iniciar cronómetro';
            manualStart.querySelector('svg').setAttribute('data-lucide', manual.startedAt !== null ? 'pause' : 'play');
            manualStart.disabled = seriesGoalReached(manual);
            document.querySelectorAll('[name="seriesGoalMode"], #seriesGoalTarget').forEach(input => input.disabled = manual.startedAt !== null && manual.interval !== null);
            manualTap.disabled = (manual.automatic && manual.startedAt === null) || seriesGoalReached(manual) || (manual.startedAt === null && manual.elapsed > 0) || (manual.automatic && manual.interval !== null);
            manualUndo.hidden = manual.automatic;
            manualUndo.disabled = manual.automatic || manual.count === 0;
            const timing = document.getElementById('seriesTiming');
            timing.hidden = !manual.automatic;
            if(advanced&&typeof queueCounterData==='function')queueCounterData();
            timing.textContent = seriesGoalReached(manual) ? 'Meta de séries concluída!' : manual.interval === null ? (manual.startedAt === null ? 'Medição parada · inicia quando estiveres pronto.' : 'A medir a primeira série… toca no quadrado quando terminares.') :
                `Série: ${(manual.interval / 1000).toFixed(1)} s · Próxima: ${Math.max(0, (manual.nextAt - elapsed) / 1000).toFixed(1)} s`;
        }

        function pauseManual() {
            if (manual.startedAt !== null) renderManual();
            if (manual.startedAt !== null) {
                manual.elapsed += performance.now() - manual.startedAt;
                manual.startedAt = null;
            }
            clearInterval(manual.timer);
            manual.timer = null;
            renderManual();
            releaseWakeLock();
            lucide.createIcons();
        }

        function startManual() {
            if (manual.startedAt !== null || seriesGoalReached(manual)) return;
            initAudioContext();
            initSpeech();
            manual.startedAt = performance.now();
            manual.timer = setInterval(renderManual, 100);
            requestWakeLock();
            renderManual();
            lucide.createIcons();
        }

        manualTap.addEventListener('click', () => {
            if (manualTap.disabled) return;
            if (manual.startedAt === null) startManual();
            if (manual.automatic) {
                const duration = manualElapsed() - manual.calibrationStart;
                if (duration < 500) return;
                manual.interval = duration;
                manual.nextAt = manualElapsed() + duration;
            }
            manual.count++;
            announceSeries();
            renderManual();
        });
        manualStart.addEventListener('click', () => manual.startedAt === null ? startManual() : pauseManual());
        manualUndo.addEventListener('click', () => {
            if (manual.automatic) return;
            closeFitTempoCelebration();
            pauseManual();
            manual.count = Math.max(0, manual.count - 1);
            if (manual.interval !== null) manual.nextAt = manual.elapsed + manual.interval;
            renderManual();
            if (manual.count > 0) announceSeries();
        });
        document.getElementById('manualReset').addEventListener('click', () => {
            closeFitTempoCelebration();
            pauseManual();
            manual.count = 0; manual.id = null;
            manual.elapsed = 0;
            manual.interval = null;
            manual.nextAt = null;
            manual.calibrationStart = 0;
            clearTimeout(speechTimer);
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            renderManual();
        });
        document.querySelectorAll('input[name="seriesMode"]').forEach(input => {
            input.addEventListener('change', () => {
                pauseManual();
                manual.automatic = input.value === 'auto';
                manual.interval = null;
                manual.nextAt = null;
                manual.calibrationStart = manualElapsed();
                renderManual();
            });
        });
        function updateSeriesGoal() {
            const resumeCalibration = manual.startedAt !== null && manual.interval === null;
            pauseManual();
            const fixed = document.querySelector('[name="seriesGoalMode"][value="fixed"]').checked;
            const input = document.getElementById('seriesGoalTarget');
            const parsed = Number(input.value);
            const target = Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 100;
            input.value = target;
            input.parentElement.hidden = !fixed;
            manual.target = fixed ? target : null;
            renderManual();
            if (resumeCalibration) startManual();
        }
        document.querySelectorAll('[name="seriesGoalMode"], #seriesGoalTarget').forEach(input => input.addEventListener('change', updateSeriesGoal));
        renderManual();
        document.getElementById('seriesGoalTarget').addEventListener('input', event => {
            const value = Number(event.target.value);
            if (Number.isSafeInteger(value) && value > 0) updateSeriesGoal();
        });
