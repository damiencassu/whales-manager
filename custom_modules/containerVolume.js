//Class representing a conainer's mounted volume

class ContainerVolume {
        /*
           containerPath : path mapped in the container
           hostPath : path mapped on the host
        */
        constructor(containerPath, hostPath){
                this.containerPath = containerPath;
                this.hostPath = hostPath;
        }
}

//Export section
module.exports = ContainerVolume;
