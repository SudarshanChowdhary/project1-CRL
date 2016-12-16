ConferenceRoomLookup.directive("nearbyRoomGrid", function($anchorScroll, responseGrid, $document, $timeout, $filter) {
    return {
        restrict: "E",
        templateUrl: "views/nearByRoomGrid.html",
        link: function($scope, $ele, $attr) {
            $scope.scrollToTime = function(initScrollDiv, index) {
                var el = $document.find("#nearbyTbl_" + index + " .table-responsive");
                el.scrollLeft(initScrollDiv);
            }

            $scope.bookSlot = {
                templateUrl: 'bookSlot.html'
            };

            $scope.createSlots = function(room) {
                if (room.busyslot.length != 0) {
                    var dt = room.busyslot[0].startDateTime;
                    dt = dt.split("T");

                    var temp = new Date(dt[0] + "T00:00:00");
                    var endDayTime = new Date(dt[0] + "T23:59:00");
                    room.slot = [];
                    angular.forEach(room.busyslot, function(slot, n) {

                        /* ignoring the time zone */
                        var sdt = new Date(slot.startDateTime.split(".")[0]);
                        var edt = new Date(slot.endDateTime.split(".")[0]);

                        var freeTime = sdt.getTime() - temp.getTime();
                        freeTime = ((freeTime / 1000) / 60) / 15;
                        freeTime = freeTime.toFixed();
                        for (var i = 0; i < freeTime; i++) {
                            room.slot.push({
                                "type": "free",
                                "highlight": false
                            });
                        }
                        var busyTime = edt.getTime() - sdt.getTime();
                        busyTime = ((busyTime / 1000) / 60) / 15;
                        busyTime = busyTime.toFixed();
                        for (var i = 0; i < busyTime; i++) {
                            room.slot.push({
                                "type": "busy",
                                "highlight": false
                            });
                        }
                        temp = edt;

                        if (n == room.busyslot.length - 1 && edt.getTime() < endDayTime.getTime()) {
                            var freeTime = endDayTime.getTime() - edt.getTime();
                            freeTime = ((freeTime / 1000) / 60) / 15;
                            freeTime = freeTime.toFixed();
                            for (var i = 0; i < freeTime; i++) {
                                room.slot.push({
                                    "type": "free",
                                    "highlight": false
                                });
                            }
                        }
                    });

                } else {
                    room.slot = [];
                    for (var i = 0; i < 96; i++) {
                        room.slot.push({
                            "type": "free",
                            "highlight": false
                        });
                    }
                }
            };

            $timeout(function() {
                $scope.nearbydata = $scope.$eval($attr.nearbydata);
                $scope.clicknumber = $scope.$eval($attr.clicknumber);

                angular.forEach($scope.nearbydata, function(building, index) {
                    angular.forEach(building.room, function(rm) {
                        $scope.createSlots(rm);
                    });
                });
            }, 1)
            $timeout(function() {

                $anchorScroll("nearbyBuilding" + $scope.clicknumber);
                angular.forEach($scope.nearbydata, function(building, index) {
                    building.initScrollDiv = 900;
                    $scope.scrollToTime(building.initScrollDiv, index);
                })
                $scope.inputData.loader = false;
            }, 1)

            $scope.creatEvent = function(index){
            $scope.eventLoader = true;
              // console.log(roomName, roomUid, startDurationTime, endDurationTime, timezone)
             var req={
                "attendeeUid":"FF5CE544-D5B2-9FBB-5C78-7A392E26B701",
                "attendeeName": "sudarshan",
                "attendeeEmail":"sudarshan_koyalkar@apple.com",
                "roomName":$scope.inputData.room.roomName,
                "roomUid":$scope.inputData.room.roomUid,
                "startTime": $filter('date')($scope.multiroom_data.slot[index].startDurationTime, 'yyyy-MM-ddTHH:mm:ss', 'UTC'),
                "endTime":$filter('date')($scope.multiroom_data.slot[index].endDurationTime, 'yyyy-MM-ddTHH:mm:ss', 'UTC'),
                "timeZone":$scope.inputData.timezone
              };

              responseGrid.bookRoom(req).then(function(res) {
                responseGrid.getMultipleRoomsData($scope.reqDataMulti).then(function(res) {
                    $scope.multiroom_data = res.data.data;
                        angular.forEach($scope.multiroom_data, function(room, m) {
                            $scope.createSlots(room);
                        });
                    $scope.nearbydata = null;
                    $scope.inputData.showNearByRoom = [false, false, false, false];
                    $scope.inputData.clickNumber = 0;
                    $scope.eventLoader = false;
                    $scope.scrollToTime($scope.initScrollDiv);
                })
              })

            }



            $scope.addDurationClass = function(obj, index) {
                $scope.startIndex = index;
                $scope.durationFlag = true;
                for (var i = index; i < index + $scope.inputData.durationIndex + 1; i++) {
                    if (obj.slot[i].type != 'free') {
                        $scope.startIndex--;
                        if (obj.slot[$scope.startIndex].type != 'free') {
                            $scope.durationFlag = false;
                        }
                    }
                }
                if ($scope.durationFlag) {
                    for (var i = $scope.startIndex; i < $scope.startIndex + $scope.inputData.durationIndex + 1; i++) {
                        obj.slot[i].highlight = true;
                    }
                }
            }

            $scope.removeDurationClass = function(obj, index) {
                for (var i = $scope.startIndex; i < $scope.startIndex + $scope.inputData.durationIndex + 1; i++) {
                    obj.slot[i].highlight = false;
                }
            };

            $scope.PreviousDay = function(clkNumber, tblIndex) {
                $scope.inputData.loader = true;
                var PrevDay = new Date();
                PrevDay.setDate($scope.inputData.d.getDate() - 1)
                $scope.inputData.d = PrevDay;
                $scope.inputData.searchDate = PrevDay.getFullYear() + "" + $scope.appendZero(PrevDay.getMonth() + 1) + "" + $scope.appendZero(PrevDay.getDate());
                $scope.inputData.buildingName = $scope.nearbydata[tblIndex].buildingName;
                angular.forEach($scope.nearbydata[tblIndex], function(rm, index) {
                    $scope.inputData.room.push({
                        roomName: rm.roomName,
                        roomUid: rm.roomUid
                    });
                });

                $scope.reqDataMulti = {
                    "room": $scope.inputData.room,
                    "searchDate": $scope.inputData.searchDate,
                    "timeRange": $scope.inputData.timeRange,
                    "timezone": $scope.inputData.timezone,
                    "unavailable": $scope.inputData.unavailable
                }
                responseGrid.getMultipleRoomsData($scope.reqDataMulti).then(function(res) {
                    $scope.multiroom_data = res.data.data;
                    angular.forEach($scope.multiroom_data, function(room, m) {
                        $scope.createSlots(room);
                    });
                    $scope.nearbydata = null;
                    $scope.inputData.showNearByRoom = [false, false, false, false];
                    $scope.inputData.clickNumber = 0;
                    $scope.inputData.loader = false;
                })
            };

            $scope.Previous4Hours = function(tblIndex) {
                if ($scope.nearbydata[tblIndex].initScrollDiv > 0) {
                    $scope.nearbydata[tblIndex].initScrollDiv -= 400;
                    $scope.scrollToTime($scope.nearbydata[tblIndex].initScrollDiv, tblIndex);
                }
            };

            $scope.Next4hours = function(tblIndex) {
                if ($scope.nearbydata[tblIndex].initScrollDiv < 1900) {
                    $scope.nearbydata[tblIndex].initScrollDiv += 400;
                    $scope.scrollToTime($scope.nearbydata[tblIndex].initScrollDiv, tblIndex);
                }
            };

            $scope.NextDay = function(clkNumber, tblIndex) {
                $scope.inputData.loader = true;
                var NextDay = new Date();
                NextDay.setDate($scope.inputData.d.getDate() + 1)
                $scope.inputData.searchDate = NextDay;
                $scope.inputData.searchDate = NextDay.getFullYear() + "" + $scope.appendZero(NextDay.getMonth() + 1) + "" + $scope.appendZero(NextDay.getDate());
                $scope.inputData.buildingName = $scope.nearbydata[tblIndex].buildingName;
                angular.forEach($scope.nearbydata[tblIndex], function(rm, index) {
                    $scope.inputData.room.push({
                        roomName: rm.roomName,
                        roomUid: rm.roomUid
                    });
                });
                $scope.reqDataMulti = {
                    "room": $scope.inputData.room,
                    "searchDate": $scope.inputData.searchDate,
                    "timeRange": $scope.inputData.timeRange,
                    "timezone": $scope.inputData.timezone,
                    "unavailable": $scope.inputData.unavailable
                }
                responseGrid.getMultipleRoomsData($scope.reqDataMulti).then(function(res) {
                    $scope.multiroom_data = res.data.data;
                    angular.forEach($scope.multiroom_data, function(room, m) {
                        $scope.createSlots(room);
                    });
                    $scope.nearbydata = null;
                    $scope.inputData.showNearByRoom = [false, false, false, false];
                    $scope.inputData.clickNumber = 0;
                    $scope.inputData.loader = false;
                })
            };

        }
    }
});
