const prr = (() => {

    let lastTaskNumber = 100;

    const getNextTaskNumber = () => {
        const lsKeys = {};
        // just using ints as keys in local storage. don't want to pick up anything other than that for getting the next available id.
        for (let ls in window.localStorage) {
            if (!isNaN(ls)) {
                lsKeys[ls] = window.localStorage[ls];
            }
        }
        const keys = Object.getOwnPropertyNames(lsKeys).map(key => parseInt(key)).sort();
        if (keys.length) {
            lastTaskNumber = Math.max(lastTaskNumber, keys[keys.length - 1]);
        }
        return ++lastTaskNumber;
    };

    // to simulate latency with server communication, which doesn't happen on this contrived page.
    const getRandomDelay = () => {
        return Math.floor(Math.random() * 1000);
    };

    // gotta start with something in the list
    const initialTasks = [
        { id: getNextTaskNumber(), subject: 'Walk the dog', status: 'Pending' },
        { id: getNextTaskNumber(), subject: 'Wash the car', status: 'Pending' },
        { id: getNextTaskNumber(), subject: 'Do the dishes', status: 'Pending' },
        { id: getNextTaskNumber(), subject: 'Bake a cake', status: 'Completed' },
        { id: getNextTaskNumber(), subject: 'Laundry', status: 'Pending' },
    ];

    // a class to represent a task
    class Task {
        constructor() {
            this.id = ko.observable();
            this.subject = ko.observable();
            this.status = ko.observable();
            this.isHovered = ko.observable(false);
        }
        toJS() {
            return {
                id: this.id(),
                subject: this.subject(),
                status: this.status()
            }
        }
        hovered() {
            this.isHovered(true);
        }
        unhovered() {
            this.isHovered(false);
        }
    }

    let self;

    // the class that's knockout-bound to the page
    class TaskManager {
        constructor() {
            self = this;
            this.tasks = ko.observableArray([]);
            this.statuses = ko.observableArray(['All', 'Pending', 'Completed']);
            this.statusChangeOptions = ko.computed(() => {
                return this.statuses().filter(s => s !== 'All');
            })
            this.statusFilter = ko.observable('All');
            this.statusFilter.subscribe(() => {
                self.isLoading(true);
                setTimeout(() => { self.isLoading(false) }, getRandomDelay());
            });
            this.sortColumn = ko.observable('id');
            this.sortAscending = ko.observable(true);

            // This is the array that's shown on the page. It's filtered by status, and sorted by user selection.
            this.filteredTasks = ko.computed(() => {
                let filteredArray;
                if (this.statusFilter() == 'All') {
                    filteredArray = this.tasks();
                } else {
                    filteredArray = this.tasks().filter(t => t.status() === self.statusFilter());
                }
                return filteredArray.sort((a,b) => {
                    let aVal = a[self.sortColumn()]();
                    let bVal = b[self.sortColumn()]();

                    if (self.sortColumn() === 'id') {
                        return (parseInt(aVal) - parseInt(bVal)) * (self.sortAscending() ? 1 : -1)
                    }

                    if (aVal.toLowerCase() > bVal.toLowerCase()) {
                        return self.sortAscending() ? 1 : -1;
                    } else {
                        return self.sortAscending() ? -1 : 1;
                    }
                });
            }, self);
            
            this.isEditing = ko.observable(false);
            this.editID = ko.observable();
            this.editSubject = ko.observable();
            this.editStatus = ko.observable();
            this.isEditing.subscribe((val) => {
                if (!val) {
                    this.editID(null);
                    this.editSubject(null);
                    this.editStatus(null);
                }
            });
            this.isLoading = ko.observable(true);
            this.isFormInvalid = ko.observable(false);
 
            // Set up initial values based on local storage. Like above, specifically looking for int keys.
            // I wouldn't do this in production-bound code, but good enough here.
            const lsKeys = {};
            for (let ls in window.localStorage) {
                if (!isNaN(ls)) {
                    lsKeys[ls] = window.localStorage[ls];
                }
            }
            if (Object.getOwnPropertyNames(lsKeys).length) {
                const keys = Object.getOwnPropertyNames(lsKeys).map(key => parseInt(key)).sort();
                keys.forEach(key => {
                    const val = JSON.parse(window.localStorage.getItem(key));
                    const task = new Task();
                    task.id(val.id);
                    task.subject(val.subject);
                    task.status(val.status);
                    self.tasks.push(task);
                });
            } else if (!window.localStorage.getItem('hasDeleted')) {
                initialTasks.forEach((t) => {
                    const task = new Task();
                    task.id(t.id);
                    task.subject(t.subject);
                    task.status(t.status);
                    self.save(task);
                });
            }
            setTimeout(() => {
                self.isLoading(false);
            }, getRandomDelay());
        }

        // validate and save a task to both the observable array and localStorage
        save(task) {
            this.isLoading(true);
            setTimeout(() => {
                self.isFormInvalid(typeof(task.subject()) === 'undefined' || task.subject() === '');
                if (self.isFormInvalid()) {
                    self.isEditing(true);
                    self.isLoading(false);
                    return;
                }
                if (!task.id()) {
                    task.id(getNextTaskNumber());
                }
                self.tasks.push(task);
                const json = JSON.stringify(task.toJS());
                window.localStorage.setItem(task.id(), json);
                self.isEditing(false);
                self.isLoading(false);
            }, getRandomDelay())
        }

        add() {
            this.edit(new Task());
        }

        edit(task) {
            self.isLoading(true);
            setTimeout(() => {
                self.isEditing(true);
                self.editID(task.id());
                self.editSubject(task.subject());
                self.editStatus(task.status());
                self.isLoading(false);
            }, getRandomDelay());
        }

        cancelEdit() {
            self.isEditing(false);
            this.isFormInvalid(false);
        }

        submitEdit() {
            this.tasks.remove((item) => item.id() === self.editID());
            const editedTask = new Task();
            editedTask.id(this.editID());
            editedTask.subject(this.editSubject());
            editedTask.status(this.editStatus());
            self.save(editedTask);
        }

        deleteTask(task) {
            self.tasks.remove((item) => item.id() === task.id());
            window.localStorage.removeItem(task.id());
            window.localStorage.setItem('hasDeleted', 'true');
        }

        // a second click on the current selected column will reverse the sort direction.
        // a click on a different column will sort ascending by that column.
        sort(col) {
            self.isLoading(true);
            setTimeout(() => {
                if (self.sortColumn() === col) {
                    self.sortAscending(!self.sortAscending());
                }
                else {
                    self.sortColumn(col);
                    self.sortAscending(true);
                }
                self.isLoading(false);
            }, getRandomDelay());
        }
    }

    return {
        TaskManager
    }
})();