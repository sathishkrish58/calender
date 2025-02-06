(function () {
    class Calendar {
        constructor(options = {}) {
            // Get the input element from options.inputElement or options.inputId
            this.inputField = options.inputElement || document.getElementById(options.inputId);

            this.mode = options.mode || "light";
            this.format = options.format || "dd-MM-yyyy";
            this.dialogWidth = options.width || "250";
            this.showTime = options.showTime || false;
            this.showSeconds = options.showSeconds || false;

            // If the input already has a value, parse it; otherwise, use today.
            if (this.inputField.value) {
                const parsed = this.parseDate(this.inputField.value, this.format);
                this.currentDate = parsed ? parsed : new Date();
            } else {
                this.currentDate = new Date();
            }

            // We'll use currentView to manage which grid is shown: "day" | "month" | "year"
            this.currentView = "day";
            // For month view: store a selected month (if changed).
            this.selectedMonth = this.currentDate.getMonth();
            // For year view: a starting year for the 9-year range
            this.yearRangeStart = this.currentDate.getFullYear() - 4;

            this.createDialog();
            this.attachEventListeners();
            this.showCalendar();
        }

        createDialog() {
            this.calendarDialog = document.createElement("div");
            this.calendarDialog.classList.add("calendar-dialog");
            this.calendarDialog.style.width = `${this.dialogWidth}px`;

            // Add mode-specific class
            if (this.mode === "dark") {
                this.calendarDialog.classList.add("dark-mode");
            } else {
                this.calendarDialog.classList.add("light-mode");
            }

            this.calendarDialog.innerHTML = `
                <div class="calendar-header">
                    <div class="nav-icons">
                        <span id="prevMonth" class="nav-icon" aria-label="Previous">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                            </svg>
                        </span>
                        <span id="monthYear"></span>
                        <span id="nextMonth" class="nav-icon" aria-label="Next">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                            </svg>
                        </span>
                    </div>
                    <span id="closeCalendar" class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </span>
                </div>
                <div class="calendar-grid" id="calendarGrid"></div>
                ${this.showTime ? this.getTimePickerHTML() : ""}
            `;

            document.body.appendChild(this.calendarDialog);
        }

        attachEventListeners() {
            // Navigation icons
            this.calendarDialog.querySelector("#prevMonth").addEventListener("click", (e) => {
                e.stopPropagation();
                this.navigatePrev();
            });
            this.calendarDialog.querySelector("#nextMonth").addEventListener("click", (e) => {
                e.stopPropagation();
                this.navigateNext();
            });
            this.calendarDialog.querySelector("#closeCalendar").addEventListener("click", (e) => {
                e.stopPropagation();
                this.destroy();
            });

            // Click on monthYear changes view if in day view.
            this.calendarDialog.querySelector("#monthYear").addEventListener("click", (e) => {
                e.stopPropagation();
                if (this.currentView === "day") {
                    this.currentView = "month";
                    this.render();
                } else if (this.currentView === "month") {
                    // Switch to year view. Header shows range: (currentYear-4) to (currentYear+4)
                    this.currentView = "year";
                    this.yearRangeStart = this.currentDate.getFullYear() - 4;
                    this.render();
                }
            });

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
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            } else if (this.currentView === "month") {
                this.currentDate.setFullYear(this.currentDate.getFullYear() - 1);
            } else if (this.currentView === "year") {
                this.yearRangeStart -= 9;
            }
            this.render('slide-left');
        }

        navigateNext() {
            if (this.currentView === "day") {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            } else if (this.currentView === "month") {
                this.currentDate.setFullYear(this.currentDate.getFullYear() + 1);
            } else if (this.currentView === "year") {
                this.yearRangeStart += 9;
            }

            this.render('slide-right');
        }

        showCalendar(event) {
            this.calendarDialog.style.display = "block";
            this.calendarDialog.classList.add("open");
            const rect = this.inputField.getBoundingClientRect();
            this.calendarDialog.style.top = `${rect.bottom + window.scrollY}px`;
            this.calendarDialog.style.left = `${rect.left + window.scrollX}px`;

            this.render();
        }

        hideCalendar() {
            this.calendarDialog.classList.remove("open");
            setTimeout(() => {
                this.calendarDialog.style.display = "none";
            }, 300);
        }

        // Removes the dialog from the DOM and cleans up event listeners
        destroy() {
            if (this.calendarDialog && this.calendarDialog.parentNode) {
                this.calendarDialog.parentNode.removeChild(this.calendarDialog);
            }
            document.removeEventListener("click", this.outsideClickHandler);
        }

        render(animationName) {
            const header = this.calendarDialog.querySelector("#monthYear");
            const grid = this.calendarDialog.querySelector("#calendarGrid");
            grid.innerHTML = "";

            // Render based on the current view
            if (this.currentView === "day") {
                // Day view: header shows current month & year.
                const options = { year: 'numeric', month: 'long' };
                header.textContent = this.currentDate.toLocaleDateString('en-US', options);
                grid.classList.remove("calendar-grid-three");
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
                 const firstDayIndex = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1).getDay();
                 const daysInMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
                // Add previous month's days
                const prevMonthDays = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 0).getDate();
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
                    cell.setAttribute('data-day', day);

                    cell.textContent = day;
                    // Highlight if this is the selected day.
                    if (day === this.currentDate.getDate()) {
                        cell.classList.add("selected");
                    }
                    daysContainer.appendChild(cell);
                }

                // Event delegation for day cells
                grid.addEventListener("click", (event) => {
                    const target = event.target;
                    if (target.classList.contains("day-cell") && target.hasAttribute('data-day')) {
                        const day = parseInt(target.getAttribute('data-day'), 10);
                        this.selectDate(day);
                    }
                });

                // Add next month's days
                const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
                const lastDayIndex = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), lastDay).getDay();
                const nextMonthDays = 7 - lastDayIndex - 1;
                for (let i = 1; i <= nextMonthDays; i++) {
                    const cell = document.createElement("div");
                    cell.classList.add("day-cell", "next-month");
                    cell.textContent = i;
                    daysContainer.appendChild(cell);
                }

                grid.appendChild(daysLabelContainer);
                grid.appendChild(daysContainer);


            } else if (this.currentView === "month") {
                // In month view, header displays current year; clicking a month cell will switch to year view.
                header.textContent = this.currentDate.getFullYear();
                // Render 12 months in a grid (we use 3 columns)
                grid.classList.remove("calendar-grid-one");
                grid.classList.add("calendar-grid-three");
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                monthNames.forEach((m, index) => {
                    this.selectedMonth = index;  // store selected month
                    this.currentView = "month";   // switch to year view
                    const cell = document.createElement("div");
                    cell.classList.add("month-cell");
                    cell.textContent = m;
                    // Highlight if this is the selected day.
                    if (index === this.currentDate.getMonth()) {
                        cell.classList.add("selected");
                    }
                    cell.addEventListener("click", () => {
                        this.selectedMonth = index;  // store selected month
                        this.currentView = "day";   // switch to year view
                        // Initialize year range based on current year
                        this.yearRangeStart = this.currentDate.getFullYear() - 4;
                        this.render();
                    });
                    grid.appendChild(cell);
                });
            } else if (this.currentView === "year") {
                // In year view, header shows "Select Year" and grid shows a 9-year range.
                header.textContent = "Select Year";
                grid.classList.remove("calendar-grid-one");
                grid.classList.add("calendar-grid-three");
                for (let i = 0; i < 9; i++) {
                    const year = this.yearRangeStart + i;
                    const cell = document.createElement("div");
                    cell.classList.add("year-cell");
                    cell.textContent = year;
                    // Highlight if this is the current year.
                    if (year === this.currentDate.getFullYear()) {
                        cell.classList.add("selected");
                    }
                    cell.addEventListener("click", () => {
                        // When a year is selected, update currentDate with the stored selectedMonth (if any)
                        const month = (this.selectedMonth !== null) ? this.selectedMonth : this.currentDate.getMonth();
                        this.currentDate = new Date(year, month, 1);
                        this.selectedMonth = month;
                        // Return to day view
                        this.currentView = "month";
                        this.render();
                    });
                    grid.appendChild(cell);
                }
            }

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

        selectDate(day) {
            // Create a new Date based on the selected day
            const selected = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);

            // If time selection is enabled, get the values from the time picker
            if (this.showTime) {
                const hours = this.calendarDialog.querySelector("#hours").value;
                const minutes = this.calendarDialog.querySelector("#minutes").value;
                const seconds = this.showSeconds ? this.calendarDialog.querySelector("#seconds").value : "00";
                selected.setHours(parseInt(hours, 10));
                selected.setMinutes(parseInt(minutes, 10));
                selected.setSeconds(parseInt(seconds, 10));
            }

            // Format the date according to the provided format string
            const formatted = this.formatDate(selected, this.format);
            this.inputField.value = formatted;
            this.destroy();
        }

        getTimePickerHTML() {
            return `
          <div class="time-picker">
            <select id="hours">${this.generateOptions(0, 23)}</select> :
            <select id="minutes">${this.generateOptions(0, 59)}</select>
            ${this.showSeconds ? `: <select id="seconds">${this.generateOptions(0, 59)}</select>` : ""}
          </div>
        `;
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
