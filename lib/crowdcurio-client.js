function TaskRoutingManager(){
    this.client = null;
    this.queues = null;
    this.params = null;
    this.taskTotal = null;
}


TaskRoutingManager.prototype.init = function(client, params) {
    if(!params){
        alert('ERROR: Parameters are required for task routing.')
    }

    // "this.queues" is an Object that contains the task queues :
    /*  key: name of the queue
        value: Object containing the queue and the total number of available tasks.

        example:
        this.queues = {
            'required': {
                queue: [Object, Object, Object],
                total: 10
            }, 'practice' : {
                queue: [Object, Object, Object]
                total: 5
            }
        }

    */
    
    this.client = client;
    this.queues = {};
    this.params = params;
    this.taskTotal = -1;
};


TaskRoutingManager.prototype.fetchTasks = function(queue_type, params, callback) {
   // add the queue type
    params['type'] = queue_type;
    
    var that = this;
    let action = ["route", "list"]
    return this.client.action(schema, action, params).then(function(response){
        
        // store the total number of tasks remaining
        that.queues[params['type']]['total'] = response.count;

        // store the fetched tasks into the queue
        that.queues[params['type']]['queue'] = response.results;

        // return the first item in the queue to the callback
        callback(that.queues[params['type']]['queue'].shift());
    });
}

TaskRoutingManager.prototype.getNextTask = function(queue_type, callback){
    // verify the queue exists
    if(!(queue_type in this.queues)){
        this.queues[queue_type] = {'queue': [], 'total': 0};
    }

    if(this.queues[queue_type]['queue'].length > 1){
        callback(this.queues[queue_type]['queue'].shift());
    } else {
        this.fetchTasks(queue_type, this.params, function(task){
            callback(task);
        });
    }
};

// - - - - - - Simulation / Testing Helpers - - - - - 
TaskRoutingManager.prototype.simulateFetchTasks = function(){
    console.log('Simulating a fetch of new tasks ... Fetched!');

    /* simualte populating the queue */
    this.queues = [
        {'id': 1, 'name': 'Papyri 1', 'url': 'https://curio-media.s3.amazonaws.com/oxyrhynchus-papyri/136833.jpg'},
        {'id': 2, 'name': 'Papyri 2', 'url': 'https://curio-media.s3.amazonaws.com/oxyrhynchus-papyri/136834.jpg'},
        {'id': 3, 'name': 'Papyri 3', 'url': 'https://curio-media.s3.amazonaws.com/oxyrhynchus-papyri/136835.jpg'},
    ]
}

TaskRoutingManager.prototype.simulateGetNextTask = function(){
    if(this.queue.length > 0){
        return this.queues.shift();
    } else {
        return [];
    }
};

//module.exports = TaskRouter;


function CrowdCurioClient(){
    // core api vars
    this.auth = null;
    this.client = null;

    // routing manager
    this.router = null;

    // routing vars
    this.task = null;
    this.data = null;
}

CrowdCurioClient.prototype.init = function(params){
    // authenticate & instantiate the client's connection
    this.auth = new coreapi.auth.SessionAuthentication({
        csrfCookieName: 'csrftoken',
        csrfHeaderName: 'X-CSRFToken'
    })
    this.client = new coreapi.Client({auth: this.auth})

    // create the task routing manager
    this.router = new TaskRoutingManager();

    // set (1) task and (2) experiment vars for routing
    this.task = {id: params['task'], type: 'Task'};
    if(params['experiment']){
        console.log('params: ');
        console.log(params);
        this.experiment = {id: params['experiment'], type: 'Experiment'}

        this.router.init(this.client, {
            'page_size': 3,
            'task': params['task'],
            'experiment': params['experiment']
        });

    } else {
        this.experiment = null;
        
        this.router.init(this.client, {
            'page_size': 3,
            'task': params['task']
        });

    }
}

CrowdCurioClient.prototype.setData = function(id){
    this.data = {id: id, type: 'Data'};
}

CrowdCurioClient.prototype.getNextTask = function(queue_type, callback){
    var that = this;
    // call the router's get next task function.
    this.router.getNextTask(queue_type, function(task){
        // if no task was returned from the API, return an empty object
        if(task === undefined){
            callback({});
        } else {
            // return the task
            callback(task);
        }
    });
}


// General-Purpose CRUD Operations for Models

CrowdCurioClient.prototype.create = function(model, params, callback){
    var that = this;
    // extend params by adding relations
    if(model === 'response'){
        params = jQuery.extend({
            data: that.data,
            task: that.task,
            experiment: that.experiment,
            condition: that.condition
        }, params);
    }

    let action = [model, "create"];
    this.client.action(schema, action, params).then(function(result) {
        callback(result);
    });
}

CrowdCurioClient.prototype.update = function(model, params, callback){
    let action = [model, "update"];
    this.client.action(schema, action, params).then(function(result) {
        callback(result);
    });
}


module.exports = CrowdCurioClient;