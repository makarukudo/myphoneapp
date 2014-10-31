angular.module('ionic.utils', [])

.factory('$localstorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  };
}])

.factory('$sessionstorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.sessionStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.sessionStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.sessionStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.sessionStorage[key] || '{}');
    }
  };
}])

.factory('$contact', function($q){
    return {
        get: function() {
            var dfd = $q.defer();            
            navigator.contacts.pickContact(function($contact){
                dfd.resolve($contact);
            },function($error){
                dfd.reject($error);
            });
            return dfd.promise;
        },
        all: function() {
            var dfd = $q.defer();   
            var $options = new ContactFindOptions();
            $options.filter = '';
            $options.multiple = true;
            navigator.contacts.find(['displayName', 'phoneNumbers', 'emails'], function($contacts){
                dfd.resolve($contacts);
            },function($error){
                dfd.reject($error);
            }, $options);
            return dfd.promise;            
        }
    };
})

.factory('$account', ['$localstorage', function($localstorage) {
  return {
      isLoggedIn: function() {
          $status = $localstorage.get('loggedIn', false);
          return ($status==1) ? true : false;
      },
      logIn: function(rtoken, username) {
          $localstorage.set('loggedIn', 1);
          $localstorage.set('requestToken', rtoken);
          $localstorage.set('username', username);
      },
      logOut: function() {
          $localstorage.set('loggedIn', null);
          $localstorage.set('requestToken', null);
          $localstorage.set('username', null);          
          $localstorage.set('account', null);
      }
  };
}])

.factory('$gmap', function($localstorage, $q) {
    var geocoder = new google.maps.Geocoder();        
    return {
        map: false,
        marker: false,
        zoom: 16,
        initMap: function() {
            $position = this.getCachedPosition();
            if (!_.isEmpty($position)) {
                var mapOptions = {
                    center: new google.maps.LatLng($position.latitude, $position.longitude),
                    zoom: this.zoom,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
            } else {
                var mapOptions = {
                    center: new google.maps.LatLng(43.07493, -89.381388),
                    zoom: this.zoom,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
            }
            this.map = new google.maps.Map(document.getElementById("map"), mapOptions);
            google.maps.event.addDomListener(document.getElementById('map'), 'mousedown', function (e) {
                e.preventDefault();
                return false;
            });
            
            if (!_.isEmpty($position)) {
                this.addMarker($position.latitude, $position.longitude);
            }
        },
        loadMap: function(success) {
            google.maps.event.addDomListener(window, 'load', this.initMap());
            success(this.map);
        },
        getCachedPosition: function() {
          return $localstorage.getObject('position');
        },
        addMarker: function(lat, lng) {
            this.marker = new google.maps.Marker({
                map: this.map,
                position: ((lng==undefined) ? lat : new google.maps.LatLng(lat, lng)),
                zoom: this.zoom
            });
        },
        removeMarker: function() {
            if (this.marker) {
                this.marker.setMap(null);
            }
        },
        setToCurrentPosition: function() {
            var dfd = $q.defer();
            $self = this;
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(pos) {
                    $self.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
                    $self.removeMarker();
                    $self.addMarker(pos.coords.latitude, pos.coords.longitude);
                    $localstorage.setObject('position', {latitude: pos.coords.latitude, longitude: pos.coords.longitude});
                    dfd.resolve($self.map, $self.marker, pos);
                }, function(error) {
                    console.log('GMAP ERROR', error);                
                    dfd.reject(error);
                });
            } else {
                dfd.reject('Geolocation disabled');                
            }
            return dfd.promise;
        },
        geocodeAddress: function(address) {
            var dfd = $q.defer();
            $self = this;
            geocoder.geocode({'address': address}, function(results, status) {
                if (status==google.maps.GeocoderStatus.OK) {
                    $self.removeMarker();
                    $self.map.setCenter(results[0].geometry.location);
                    $self.addMarker(results[0].geometry.location);
                    dfd.resolve({map: $self.map, marker: $self.marker, loc: results[0].geometry.location});
                } else {
                    console.log('GMAP FAILED', status);
                    dfd.reject(status);
                }
            }, function(error){
                console.log('GMAP ERROR', error);
                dfd.reject(error);
            });
            return dfd.promise;
        },
        getLatLng: function(address) {
            var dfd = $q.defer();            
            $self = this;
            geocoder.geocode({'address': address}, function(results, status) {
                if (google.maps.GeocoderStatus.OK==status) {
                    dfd.resolve({loc: results[0].geometry.location, add: results[0].formatted_address, map: $self.map, marker: $self.marker});
                } else {
                    console.log('GMAP FAILED', status);
                    dfd.reject(status);
                }
            }, function(error){
                console.log('GMAP ERROR', error);
                dfd.reject(error);
            });
            return dfd.promise;
        },
        computeInMeters: function(lat, lng) {
            var current = $localstorage.getObject('position');
            if (current) {
                var latLngA = new google.maps.LatLng(lat,lng);
                var latLngB = new google.maps.LatLng(current.latitude, current.longitude);
                return google.maps.geometry.spherical.computeDistanceBetween(latLngA, latLngB);                
            } else {
                return 'Please enable GPS.';
            }
        }
    };
})

.factory('$faves', function($localstorage) {
    return {
        getGroups: function($success) {
            $_groups = $localstorage.getObject('grp');
            $_faves = $localstorage.getObject('faves');
            if ($_groups.length > 0) {
                if ($_faves.length > 0) {
                    for($_g in $_groups) {
                        for($_c in $_groups[$_g].categories) {
                            for($_f in $_faves) {
                                if ($_faves[$_f].cid==$_groups[$_g].categories[$_c].cid) {
                                    $_groups[$_g].categories[$_c] = _.extend($_groups[$_g].categories[$_c], $_faves[$_f]);
                                }
                            }
                        }
                    }                    
                }
                return $_groups;
            } else {
                $.get(apiURL + 'categories/group', {}, function($data){
                    $_groups = $data.groups;
                    $localstorage.setObject('grp', $_groups);
                    $success($_groups);
                }, 'json');
                return [];
            };
        },
        addFave: function($fav) {
            $faves = $localstorage.getObject('faves');
            if (_.isEmpty($faves)) { $faves = []; };
            //prevent duplicates
            this.removeFave($fav.cid, $faves);
            $faves.push({cid: $fav.cid, cname: $fav.cname, color: $fav.color});
            $localstorage.setObject('faves', $faves);
        },
        removeFave: function($favId, $storage) {
            $faves = $storage || $localstorage.getObject('faves');
            $faves = _.remove($faves, function($fav){
                return ($fav.cid!=$favId);
            });
            $localstorage.setObject('faves', $faves);
        },
        getTotalFave: function() {
            $faves = $localstorage.getObject('faves');
            return $faves.length;
        }
    };
})

.factory('$japi', function($http, $q, $localstorage) {
    //http://localhost/neerapi/api/
    //http://neerdeveloper.aws.af.cm/api/
    
    
    return {
        apiURL: 'http://neerdeveloper.aws.af.cm/api/',      
        withHeaders: function() {
            $.ajaxSetup({headers: {'X-request-token': $localstorage.get('requestToken')}});
            return this;
        },
        getGroups: function() {
            $_groups = $localstorage.getObject('grp');
            $_faves = $localstorage.getObject('faves');
            if ($_groups.length > 0) {
                if ($_faves.length > 0) {
                    for($_g in $_groups) {
                        for($_c in $_groups[$_g].categories) {
                            for($_f in $_faves) {
                                if ($_faves[$_f].cid==$_groups[$_g].categories[$_c].cid) {
                                    $_groups[$_g].categories[$_c] = _.extend($_groups[$_g].categories[$_c], $_faves[$_f]);
                                }
                            }
                        }
                    }                    
                }
                var deferred = $q.defer();
                deferred.resolve($_groups);
                return deferred.promise;
            } else {
                this.withHeaders();
                return this.get('categories/group');
            };
        },
        getProfile: function() {
            $account = $localstorage.getObject('account');
            if (!_.isEmpty($account)) {
                var deferred = $q.defer();
                deferred.resolve($account);
                return deferred.promise;
            } else {
                this.withHeaders();
                $username = $localstorage.get('username');
                return this.get('account/profile/'+$username);
            }
        },
        get: function(url, data) {
            console.log('JQUERY GET + ANGULAR DEFERRED');
            var deferred = $q.defer();
            $.get(this.apiURL + url, data || {}, function(data){
                if (data.status) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            }, 'json');
            return deferred.promise;
        },
        post: function(url, data) {
            console.log('JQUERY POST + ANGULAR DEFERRED');            
            var deferred = $q.defer();
            $.post(this.apiURL + url, data || {}, function(data){
                if (data.status) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            }, 'json');
            return deferred.promise;            
        }        
    };
});

angular.module('neerapp', ['ionic', 'ionic.utils', 'neer.ctrl'])
.run(function($ionicPlatform) {
    
    document.getElementById('main-wrapper')
    
    $ionicPlatform.ready(function() {
        if(window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            window.addEventListener('native.keyboardshow', function(e){
                
            });    
        }
        if(window.StatusBar) {
            StatusBar.hide();
        }
    });
})

.config(function($httpProvider) {
    
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    $httpProvider.defaults.transformRequest = function(data){
        if (data===undefined) {
            return data;
        }
        return $.param(data);
    }    
//$stateProvider, $urlRouterProvider,     
//  $stateProvider
//    .state('home', {
//      url: "/",
//      templateUrl: "templates/home.html"
//    });
//  // if none of the above states are matched, use this as the fallback
//  $urlRouterProvider.otherwise('/');
});