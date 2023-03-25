//Class representing a container's network

class ContainerNetwork {
       /*
          ip : ip(s) the container is binded to
          privatePort : private port the container is listening to
          publicPort : public port the container is listening to
       */
        constructor(ip, privatePort, publicPort){
                this.ip = ip;
                this.privatePort = privatePort;
                this.publicPort = publicPort;
        }
}

//Export section
module.exports = ContainerNetwork;
