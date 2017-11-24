

function TaskRouter(){
    this.queue;
    this.params;
}

TaskRouter.prototype.init = function(task_id) {
    this.queue = [];
    this.params = {
        public: "True",
        task: task_id,
        page_size: 3
    }
};


TaskRouter.prototype.fetchTasks = function(params) {
    var that = this;
    $.getJSON("/api/route/", function (response) {
        /* build the task queue */
        if (response.data.length > 0) {
            for (var i = 0; i < response.data.length; i++) {
                that.queue.push(response.data[i]);
            }
        }
    });
}

TaskRouter.prototype.getNextTask = function(){
    if(this.queue.length > 1){
        this.queue.shift();
    } else {
        this.fetchTasks(this.params);
    }
};

// - - - - - - Simulation / Testing Helpers - - - - - 
TaskRouter.prototype.simulateFetchTasks = function(){
    console.log('Simulating a fetch of new tasks ... Fetched!');

    /* simualte populating the queue */
    this.queue = [
        {'id': 1, 'name': 'Papyri 1', 'url': 'img/manuscript1.jpg'},
        {'id': 2, 'name': 'Papyri 2', 'url': 'img/manuscript2.jpg'},
        {'id': 3, 'name': 'Papyri 3', 'url': 'img/manuscript3.jpg'},
    ]
}

TaskRouter.prototype.simulateGetNextTask = function(){
    if(this.queue.length > 0){
        return this.queue.shift();
    } else {
        return [];
    }
};

module.exports = TaskRouter;