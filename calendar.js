(function () {
    class Calendar {
        constructor(options = {}) {
            // Get the input element from options.inputElement or options.inputId
            this.inputField = options.inputElement || document.getElementById(options.inputId);
            this.config = this.getConfig();

            // If the input already has a value, parse it; otherwise, use today.
            this.currentDate = new Date();
            this.selectedDate = this.inputField.value
                ? this.parseDate(this.inputField.value, this.config.format) || new Date()
                : new Date();

            this.currentView = "day";
            // For month view: store a selected month (if changed).
            this.selectedMonth = this.selectedDate.getMonth();
            // For year view: a starting year for the 9-year range
            this.yearRangeStart = this.selectedDate.getFullYear() - 4;

            this.createDialog();
            this.attachEventListeners();
            this.showCalendar();
        }

        getConfig() {
            const options = this.inputField.getAttribute('data-options') ? JSON.parse(this.inputField.getAttribute('data-options')) : {};

            return {
                theme_class: options.mode == 'dark' ? 'dark-mode' : 'light-mode',
                format: options.format || "dd-MM-yyyy",
                time: !!options.time,
                second: !!options.second,
                width: parseInt(options.width, 10) || 250,
                save_text: options.save_label || "Set",
                cancel_text: options.cancel_label || "Cancel"
            }
        }

        createDialog() {
            if (document.querySelector(".calendar-dialog")) {
                document.querySelector(".calendar-dialog").remove();
            }

            this.calendarDialog = document.createElement("div");
            this.calendarDialog.classList.add(this.config.theme_class, "calendar-dialog");
            this.calendarDialog.style.width = `${this.config.width}px`;


            this.renderHeader();
            this.renderBody();
            this.renderFooter();
            if (this.config.time) {
                this.getTimePickerHTML();
            }

            document.body.appendChild(this.calendarDialog);
        }

        renderHeader() {
            const header = document.createElement("div");
            header.className = "calendar-header";

            const headerLeft = document.createElement("div");
            headerLeft.className = "header-left";

            // Month Container
            const monthContainer = document.createElement("div");
            monthContainer.className = "month-container";
            monthContainer.innerHTML = `
                <span id="monthYear" class="month-display"></span>
            `;

            // right side navition
            const headerRight = document.createElement("span");
            headerRight.className = "header-right";

            headerRight.innerHTML = `
                <span id="prevYear" class="nav-icon" aria-label="Previous">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                    </svg>
                </span>
                <span id="nextYear" class="nav-icon" aria-label="Next">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                    </svg>
                </span>
            `;

            headerLeft.appendChild(monthContainer);

            header.appendChild(headerLeft);
            header.appendChild(headerRight);
            this.calendarDialog.appendChild(header);
        }

        renderBody() {
            const body = document.createElement("div");
            body.className = "calendar-body";
            this.calendarDialog.appendChild(body);
            this.render();
        }

        render(animationName) {
            const grid = document.createElement("div");
            grid.className = "calendar-grid";
            grid.innerHTML = '';

            // Day view: shows current month & year.
            const monthDisplay = this.calendarDialog.querySelector("#monthYear");

            if (this.currentView == 'day') {
                const options = { year: 'numeric', month: 'long' };
                monthDisplay.textContent = this.selectedDate.toLocaleString("default", options);

                grid.classList.add("calendar-grid-one");
                const daysLabelContainer = document.createElement("div");
                daysLabelContainer.classList.add("calendar-grid", "calendar-grid-days-container");

                const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                days.forEach(day => {
                    const label = document.createElement("div");
                    label.classList.add("day-label");
                    label.textContent = day;
                    daysLabelContainer.appendChild(label);
                });

                const daysContainer = document.createElement("div");
                daysContainer.classList.add("calendar-grid", "calendar-grid-animation", "calendar-grid-days-container");

                // Calculate first day index and number of days in month
                const firstDayIndex = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1).getDay();
                const daysInMonth = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 0).getDate();
                // Add previous month's days
                const prevMonthDays = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 0).getDate();
                for (let i = firstDayIndex - 1; i >= 0; i--) {
                    const cell = document.createElement("div");
                    cell.classList.add("day-cell", "prev-month");
                    cell.textContent = prevMonthDays - i;
                    daysContainer.appendChild(cell);
                }

                // Add day cells
                for (let day = 1; day <= daysInMonth; day++) {
                    const cell = document.createElement("div");
                    cell.classList.add("day-cell");
                    cell.setAttribute('data-value', day);

                    cell.textContent = day;
                    // Highlight if this is the selected day.
                    if (day === this.selectedDate.getDate()) {
                        cell.classList.add("selected");
                    }

                    if (day === this.currentDate.getDate() && this.currentDate.getMonth() === this.selectedDate.getMonth() && this.currentDate.getFullYear() === this.selectedDate.getFullYear()) {
                        cell.classList.add("current-date");
                    }
                    daysContainer.appendChild(cell);
                }

                // Ensure 6 rows of day cells
                const totalCells = firstDayIndex + daysInMonth;
                const extraCells = (6 * 7) - totalCells;
                for (let i = 1; i <= extraCells; i++) {
                    const cell = document.createElement("div");
                    cell.classList.add("day-cell", "next-month");
                    cell.setAttribute('data-value', i);
                    cell.textContent = i;
                    daysContainer.appendChild(cell);
                }

                grid.appendChild(daysLabelContainer);
                grid.appendChild(daysContainer);

            } else if (this.currentView == 'month') {
                grid.classList.add("calendar-grid-animation", "calendar-grid-three");

                monthDisplay.textContent = this.selectedDate.getFullYear();

                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                monthNames.forEach((m, index) => {
                    const cell = document.createElement("div");
                    cell.classList.add("month-cell");
                    cell.setAttribute('data-value', index);
                    cell.textContent = m;
                    // Highlight if this is the selected day.
                    if (index === this.selectedDate.getMonth()) {
                        cell.classList.add("selected");
                    }
                    grid.appendChild(cell);
                });

            } else if (this.currentView == 'year') {
                grid.classList.add("calendar-grid-animation", "calendar-grid-three");

                const currentYear = this.selectedDate.getFullYear();
                const startYear = currentYear - 4; // Display a range of 9 years
                const endyear = startYear + 12;

                monthDisplay.textContent = `${startYear} - ${endyear - 1}`;
                for (let i = startYear; i < endyear; i++) {
                    const yearCell = document.createElement("div");
                    yearCell.classList.add("year-cell");
                    yearCell.setAttribute('data-value', i);
                    yearCell.textContent = i;
                    if (i === currentYear) {
                        yearCell.classList.add("selected");
                    }
                    grid.appendChild(yearCell);
                }
            }

            this.calendarDialog.querySelector(".calendar-body").innerHTML = "";
            this.calendarDialog.querySelector(".calendar-body").appendChild(grid);

            // Event delegation for day cells
            grid.addEventListener("click", (event) => {
                const target = event.target;
                if(target.hasAttribute('data-value')) {
                    if (target.classList.contains("day-cell")) {
                        const day = parseInt(target.getAttribute('data-value'), 10);
                        this.selectedDate.setDate(day);
                        this.selectedCell(day);
                    } else if(target.classList.contains("month-cell")) {
                        const monthNumber = parseInt(target.getAttribute('data-value'), 10);
                        this.selectedDate.setMonth(monthNumber);  // store selected month
                        this.currentView = 'day';
                        this.render();
                    } else if(target.classList.contains("year-cell")) {
                        const yearNumber = parseInt(target.getAttribute('data-value'), 10);
                        this.selectedDate.setFullYear(yearNumber);  // store selected month
                        this.currentView = 'month';
                        this.render();
    
                    }
                }
            });

            if (animationName) {
                // Apply the slide-right animation to day-cell elements
                const dayCells = this.calendarDialog.querySelectorAll(`.calendar-grid-animation`);
                dayCells.forEach(cell => {
                    cell.classList.add(animationName);
                });

                // Remove the animation class after the animation ends
                setTimeout(() => {
                    dayCells.forEach(cell => {
                        cell.classList.remove(animationName);
                    });
                }, 500); // Match the duration of the animation (500ms)
            }
        }

        attachEventListeners() {
            // Navigation icons
            this.calendarDialog.querySelector("#prevYear").addEventListener("click", (e) => {
                e.stopPropagation();
                this.navigatePrev();
            });
            this.calendarDialog.querySelector("#nextYear").addEventListener("click", (e) => {
                e.stopPropagation();
                this.navigateNext();
            });
            this.calendarDialog.querySelector("#calendar-cancel").addEventListener("click", (e) => {
                e.stopPropagation();
                this.destroy();
            });

            // Click on monthYear changes view if in day view.
            this.calendarDialog.querySelector("#monthYear").addEventListener("click", (e) => { this.changeView() });

            // Stop propagation to avoid immediate closing when clicking inside the dialog
            this.calendarDialog.addEventListener("click", (e) => e.stopPropagation());

            // Hide the calendar if clicking outside of it
            document.addEventListener("click", this.outsideClickHandler = (e) => {
                if (!this.calendarDialog.contains(e.target) && e.target !== this.inputField) {
                    this.destroy();
                }
            });
        }

        navigatePrev() {
            if (this.currentView === "day") {
                this.selectedDate.setMonth(this.selectedDate.getMonth() - 1);
            } else if (this.currentView === "month") {
                this.selectedDate.setFullYear(this.selectedDate.getFullYear() - 1);
            } else if (this.currentView === "year") {
                this.selectedDate.setFullYear(this.selectedDate.getFullYear() - 12);
            }
            this.render('slide-left');
        }

        navigateNext() {
            if (this.currentView === "day") {
                this.selectedDate.setMonth(this.selectedDate.getMonth() + 1);
            } else if (this.currentView === "month") {
                this.selectedDate.setFullYear(this.selectedDate.getFullYear() + 1);
            } else if (this.currentView === "year") {
                this.selectedDate.setFullYear(this.selectedDate.getFullYear() + 12);
            }

            this.render('slide-right');
        }

        changeView() {
            if (this.currentView == 'day') {
                this.currentView = 'month';
            } else if (this.currentView == 'month') {
                this.currentView = 'year'
            } else if (this.currentView == 'year') {
                this.currentView = 'month'
            }
            this.render();
        }

        showCalendar(event) {
            this.calendarDialog.style.display = "block";
            this.calendarDialog.classList.add("open");
            const rect = this.inputField.getBoundingClientRect();
            this.calendarDialog.style.top = `${rect.bottom + window.scrollY}px`;
            this.calendarDialog.style.left = `${rect.left + window.scrollX}px`;
        }

        // Removes the dialog from the DOM and cleans up event listeners
        destroy() {
            if (this.calendarDialog && this.calendarDialog.parentNode) {
                this.calendarDialog.parentNode.removeChild(this.calendarDialog);
            }
            document.removeEventListener("click", this.outsideClickHandler);
        }

        selectedCell(day) {
            // Create a new Date based on the selected day
            const selected = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), day);

            // If time selection is enabled, get the values from the time picker
            if (this.config.time) {
                const hours = this.calendarDialog.querySelector("#hours").value;
                const minutes = this.calendarDialog.querySelector("#minutes").value;
                const seconds = this.config.second ? this.calendarDialog.querySelector("#seconds").value : "00";
                selected.setHours(parseInt(hours, 10));
                selected.setMinutes(parseInt(minutes, 10));
                selected.setSeconds(parseInt(seconds, 10));
            }

            // Format the date according to the provided format string
            const formatted = this.formatDate(selected, this.config.format);
            this.inputField.value = formatted;
            this.destroy();
        }

        renderFooter() {
            const footer = document.createElement("div");
            footer.className = 'calendar-footer';
            footer.innerHTML = `
                <span id="calendar-cancel" class="button">${this.config.cancel_text}</span>
                <span id="calendar-save" class="button">${this.config.save_text}</span>
            `;

            this.calendarDialog.appendChild(footer)
        }


        getTimePickerHTML() {
            const footer = document.createElement("div");
            footer.className = 'time-picker';
            footer.innerHTML = `
                 <select id="hours">${this.generateOptions(0, 23)}</select> :
                 <select id="minutes">${this.generateOptions(0, 59)}</select>
                ${this.config.second ? `: <select id="seconds">${this.generateOptions(0, 59)}</select>` : ""}
            `;

            this.calendarDialog.appendChild(footer)
        }

        generateOptions(start, end) {
            let options = "";
            for (let i = start; i <= end; i++) {
                const num = String(i).padStart(2, "0");
                options += `<option value="${num}">${num}</option>`;
            }
            return options;
        }

        // A simple parser that supports format tokens: dd, MM, yyyy, HH, mm, ss.
        parseDate(str, format) {
            try {
                // Split the format and the string by non-alphanumeric characters.
                const formatParts = format.split(/[^A-Za-z]+/);
                const dateParts = str.split(/[^0-9]+/);
                let day, month, year, hours = 0, minutes = 0, seconds = 0;
                formatParts.forEach((token, i) => {
                    const value = parseInt(dateParts[i], 10);
                    if (token === "dd") day = value;
                    else if (token === "MM") month = value - 1;
                    else if (token === "yyyy") year = value;
                    else if (token === "HH") hours = value;
                    else if (token === "mm") minutes = value;
                    else if (token === "ss") seconds = value;
                });
                return new Date(year, month, day, hours, minutes, seconds);
            } catch (e) {
                return null;
            }
        }

        // A simple date formatter that supports the tokens:
        // dd, MM, yyyy, HH, mm, ss, and S
        formatDate(date, format) {
            const map = {
                dd: String(date.getDate()).padStart(2, "0"),
                MM: String(date.getMonth() + 1).padStart(2, "0"),
                yyyy: date.getFullYear(),
                HH: String(date.getHours()).padStart(2, "0"),
                mm: String(date.getMinutes()).padStart(2, "0"),
                ss: String(date.getSeconds()).padStart(2, "0"),
                S: date.getMilliseconds()
            };

            // Replace each token in the format string with its corresponding value.
            return format.replace(/dd|MM|yyyy|HH|mm|ss|S/g, matched => map[matched]);
        }
    }

    window.Calendar = Calendar;
})();
