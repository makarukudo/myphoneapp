angular.module('neer.ctrl', [])

.controller('PostCtrl', function($scope, $faves, $ionicModal, $ionicPopup, $ionicPopover) {

    $scope.postItemCategory = 'General';
    $scope.postItemTemplate = 'templates/types/general.html';
    
    $ionicModal.fromTemplateUrl('templates/postitem.html', {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
    }).then(function(modal) {
        $scope.postItemModal = modal;
    });
    
    $scope.createPostItem = function(category) {
        $scope.postItemCategory = category.cname;
        $specials = ['Landscaping'];
        if (_.indexOf($specials, category.cname)!=-1) {
            $scope.postItemTemplate = 'templates/types/'+category.cname+'.html';            
        } else {
            $scope.postItemTemplate = 'templates/types/'+category.cgroup+'.html';            
        }
        $scope.postId = category.cid;
        $scope.postItemModal.show();
    };
    
    $scope.colors = ['positive', 'calm', 'balanced', 'energized', 'assertive', 'royal', 'dark'];
    
    $scope.addToFavorites = function(category) {
        if (category.checked=='on') {
            $scope.category = category;
            var colorPopup = $ionicPopup.alert({
                title: 'Select Color',
                templateUrl: 'templates/selectcolor.html',
                scope: $scope
            });               
            colorPopup.then(function(res) {
                $faves.addFave($scope.category);
           });
        } else {
            $faves.removeFave(category.cid);
        }
    };
    
    $ionicPopover.fromTemplateUrl('templates/setfavecolor.html', {
        scope: $scope
    }).then(function(popover) {
        $scope.setFavColorPopover = popover;
    });
    
})

.controller('MainCtrl', function($scope, $rootScope, $localstorage, $account, $contact, $faves, $gmap, $japi, $ionicModal, $ionicLoading, $ionicPopover) {
    
    $rootScope.isLoggedIn = $account.isLoggedIn();
    
    //login modal
    $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
    }).then(function(modal) {
        $scope.loginModal = modal;
    });
    
    //profile modal
    $ionicModal.fromTemplateUrl('templates/account-profile.html', {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
    }).then(function(modal) {
        $scope.profileModal = modal;
    });        
    
    //myneer modal
    $ionicModal.fromTemplateUrl('templates/myneer.html', {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
    }).then(function(modal) {
        $scope.myNeerModal = modal;
    });        
    
    
    //loading contacts
    $scope.contacts = [];
    //get all contacts from phone
    if (navigator.contacts) {
        $contact.all().then(function($contacts){
            _.forEach($contacts, function($contact) {
                if ($contact.displayName!='') {
                    $scope.contacts.push($contact);                    
                }
            });
        }, function($error) {
            console.log('Contacts not available');
        });            
    } else {
        $scope.contacts = [{displayName: 'All User'}];
    }    
    
    //contacts
    $ionicModal.fromTemplateUrl('templates/contact.html', {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
    }).then(function(modal) {
        $scope.contactModal = modal;
    });
    
    //create post modal
    $ionicModal.fromTemplateUrl('templates/createpost.html', {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
    }).then(function(modal) {
        $scope.createPostModal = modal;
    });
    
    //listing modal
    $ionicModal.fromTemplateUrl('templates/listing.html', {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
    }).then(function(modal) {
        $scope.showListingModal = modal;
    });
    
    $japi.getGroups().then(function(data){
        if (data.groups!=undefined) {
            $scope.groups = data.groups;
            $localstorage.setObject('grp', data.groups);
        } else {
            $scope.groups = data;
        }
    });
    
    $scope.faves = $localstorage.getObject('faves');
    $ionicPopover.fromTemplateUrl('templates/favorites.html', {
        scope: $scope
    }).then(function(popover) {
        $scope.favPopover = popover;
    });

    $scope.showFavorites = function($event) {
        $scope.faves = $localstorage.getObject('faves');
        $scope.favPopover.show($event);
    };

    $scope.showLoginForm = function() {
        if ($account.isLoggedIn()) {
            $ionicLoading.show();
            $japi.getProfile()
            .then(function($data){
                if ($data.data!=undefined) {
                    $scope.account = $data.data;
                    $localstorage.setObject('account', $data.data);
                } else {
                    $scope.account = $data;
                }
            }, function(){
                alert('Unable to load profile');
            })
            .finally(function(){
                $ionicLoading.hide();
            });            
            $scope.totalFave = $faves.getTotalFave();
            $scope.profileModal.show();
        } else {
            $scope.loginModal.show();
        }
    };
    
    //MY NEER
    $scope.showMyNeer = function() {
        if ($account.isLoggedIn()) {
            $scope.posts = {};
            $ionicLoading.show();
            $japi.withHeaders().get('post/myneer')
            .then(function($posts){
                $scope.neers = $posts.groups;
            })
            .finally(function(){
                $ionicLoading.hide();
            });
            $scope.myNeerModal.show();
        } else {
            $scope.loginModal.show();
        }
    };

    $scope.createPost = function() {
        if ($account.isLoggedIn()) {
            $scope.createPostModal.show();
        } else {
            $scope.loginModal.show();
        }
    };
    
    $scope.showListing = function() {
        $scope.showListingModal.show();
    };
    
    $scope.centerOnMe = function () {
        if (!$scope.map) {
            return;
        }
        $ionicLoading.show();
        $gmap.setToCurrentPosition().then(function(){

        }, function(){
            alert('Unable to find your address.');
        })
        .finally(function(){
            $ionicLoading.hide();
        });
    };    
    
    $scope.findAddress = function(address, $event) {
        if ($event.which==13 || $event.keyCode==13) {
            $ionicLoading.show();
            $gmap.geocodeAddress(address).then(function(){
                
            }, function(){
                alert('Cannot find this address.');
            })
            .finally(function(){
                $ionicLoading.hide();
            });
        }
    };
    
    $gmap.loadMap(function(map){
        $scope.map = map;
        if (_.isEmpty($gmap.getCachedPosition())) {
            $scope.centerOnMe();
        }
    });

})

.controller('PostItemForm', function($scope, $rootScope, $japi, $contact, $gmap, $ionicModal, $ionicLoading){
    
    $scope.post = {};
    $scope.post['items'] = [];
    $scope.post['schedule'] = 1;
    $scope.post['paymode'] = 1;    
    $scope.changeSched = function($sched) {
        $scope.post['schedule'] = $sched;
    };
    $scope.changePayMode = function($mode) {
        $scope.post['paymode'] = $mode;
    };    
    $scope.addItem = function() {
        $scope.post.items.push({qty: '', desc: ''});
    };
    $scope.createPost = function($post) {
        $ionicLoading.show();
        $post['category'] = $scope.postId;
        
        //send post data to create_post method
        $japi.withHeaders().post('post/create', $post)
        .then(function(){
            $scope.createPostModal.hide();
        }, function($data) {
            console.log($data);
            $scope.errors = $data.errors || {};
            $scope.error = $data.error || {};
        })
        .finally(function(){
            $ionicLoading.hide();
        });
    };
    $scope.getLatLng = function(address) {
        if (!_.isEmpty(address)) {
            $gmap.getLatLng(address).then(function(res){
                $scope.latlng = '('+parseFloat(res.loc.k).toFixed(4)+', '+parseFloat(res.loc.B).toFixed(4)+')';
                $scope.post['latitude'] = res.loc.k; // k=latitude
                $scope.post['longitude'] = res.loc.B; // B=longitude
                $scope.address = res.add;
            }, function(){
                alert('Unable to find address');
                $scope.post['address'] = '';
                $scope.post['latitude'] = null;
                $scope.post['longitude'] = null;
            });            
        }
    };
    
    $scope.getContacts = function() {
        $scope.contactModal.show();
    };
    
})

.controller('ProfileCtrl', function($scope, $rootScope, $account){
    $scope.logOut = function() {
        $rootScope.isLoggedIn = false;        
        $account.logOut();
        $scope.profileModal.hide();
    };
})

.controller('ContactCtrl', function($scope, $rootScope, $contact){
    $rootScope.selcontacts = [];
    $scope.addContact = function($contact) {
        if ($contact.checked=='on') {
            $rootScope.selcontacts.push($contact);            
        } else {
            $rootScope.selcontacts = _.remove(function($c){
                return ($c.displayName!=$contact.displayName);
            });
        }
    };
    
})

.controller('LoginCtrl', function($scope, $rootScope, $account, $japi, $ionicLoading) {
    
    $scope.logIn = function(user) {
        $scope.loading = $ionicLoading.show({
            content: 'Getting current location',
            showBackdrop: true
        });
        
        $japi.post('account/login', user)
        .then(function($data){
            $rootScope.isLoggedIn = true;
            $account.logIn($data.request_token, $data.username);
            $scope.loginModal.hide();
        }, function($data){
            $scope.errors = $data.errors || {};
            $scope.error = $data.error || {};
        })
        .finally(function(){
            $ionicLoading.hide();
        });
    };
    
});
