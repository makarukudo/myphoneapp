[];
    var $_groups = $localstorage.getObject('grp');
    var $_faves = $localstorage.getObject('faves');
    if ($_groups.length > 0) {
        for($_g in $_groups) {
            for($_c in $_groups[$_g].categories) {
                for($_f in $_faves) {
                    if ($_faves[$_f].cid==$_groups[$_g].categories[$_c].cid) {
                        $_groups[$_g].categories[$_c] = _.extend($_groups[$_g].categories[$_c], $_faves[$_f]);
                    }
                }
            }
        }
        $scope.groups = $_groups;
    } else {
        $.get(apiURL + 'categories/group', {}, function($data){
            $scope.groups = $data.groups;
            $localstorage.setObject('grp', $scope.groups);
        }, 'json');
    };
    
    
                $faves = _.remove($faves, function($fav){
                return ($fav.cid!=category.cid);
            });
            $localstorage.setObject('faves', $faves);           