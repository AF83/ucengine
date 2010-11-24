-module(meeting_tests).

-include("uce.hrl").
-include_lib("eunit/include/eunit.hrl").

meeting_test_() ->
    { setup
      , fun fixtures:setup/0
      , fun fixtures:teardown/1
      , fun(Testers) ->
		[ ?_test(test_create(Testers)),
		  ?_test(test_create_not_found_org(Testers)),
		  ?_test(test_create_conflict(Testers)),
		  ?_test(test_create_bad_start(Testers)),
		  ?_test(test_create_bad_end(Testers)),
		  ?_test(test_create_unauthorized(Testers)),
		  
		  ?_test(test_get(Testers)),
		  ?_test(test_get_not_found_meeting(Testers)),
		  ?_test(test_get_not_found_org(Testers)),
		  
		  ?_test(test_list_all(Testers)),
		  ?_test(test_list_upcoming(Testers)),
		  ?_test(test_list_closed(Testers)),
		  ?_test(test_list_open(Testers)),
		  ?_test(test_list_bad_parameters(Testers)),
		  ?_test(test_list_not_found(Testers)),

		  ?_test(test_update(Testers)),
		  ?_test(test_update_not_found_meeting(Testers)),
		  ?_test(test_update_not_found_org(Testers)),
		  ?_test(test_update_bad_start(Testers)),
		  ?_test(test_update_bad_end(Testers)),
		  ?_test(test_update_unauthorized(Testers)),
		  
		  ?_test(test_join(Testers)),
		  ?_test(test_join_not_found_meeting(Testers)),
		  ?_test(test_join_not_found_org(Testers)),
		  ?_test(test_join_not_found_uid(Testers)),
		  ?_test(test_join_unauthorized(Testers)),
		  
		  ?_test(test_leave(Testers)),
		  ?_test(test_leave_not_found_meeting(Testers)),
		  ?_test(test_leave_not_found_org(Testers)),
		  ?_test(test_leave_not_found_uid(Testers)),
		  ?_test(test_leave_unauthorized(Testers))]
	end
    }.

test_create([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
             , {"sid", RootSid}
	     , {"start", integer_to_list(utils:now())}
             , {"metadata[description]", "Meeting"}],
    {struct, [{"result", "created"}]} = tests_utils:put("/meeting/testorg/all/newmeeting", Params).

test_create_not_found_org([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
             , {"sid", RootSid}
	     , {"start", integer_to_list(utils:now())}
             , {"metadata[description]", "Meeting"}],
    {struct, [{"error", "not_found"}]} =
	tests_utils:put("/meeting/unexistentorg/all/newmeeting", Params).

test_create_conflict([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
             , {"sid", RootSid}
	     , {"start", integer_to_list(utils:now())}
             , {"metadata[description]", "Meeting"}],
    {struct, [{"error", "conflict"}]} = tests_utils:put("/meeting/testorg/all/newmeeting", Params).

test_create_bad_start([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
             , {"sid", RootSid}
	     , {"start", "i wish i was an integer"}
             , {"metadata[description]", "Meeting"}],
    {struct, [{"error", "bad_parameters"}]} =
	tests_utils:put("/meeting/testorg/all/newmeeting", Params).

test_create_bad_end([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
             , {"sid", RootSid}
	     , {"end", "i wish i was an integer"}
             , {"metadata[description]", "Meeting"}],
    {struct, [{"error", "bad_parameters"}]} =
	tests_utils:put("/meeting/testorg/all/newmeeting", Params).

test_create_unauthorized([_, {UglyUid, UglySid}]) ->
    Params = [ {"uid", UglyUid}
             , {"sid", UglySid}
	     , {"start", "0"}
             , {"metadata[description]", "Meeting"}],
    {struct, [{"error", "unauthorized"}]} =
	tests_utils:put("/meeting/testorg/all/newmeeting", Params).


test_get([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
             , {"sid", RootSid}],
    {struct, [{"result",
	       {struct,
		[{"org", "testorg"},
		 {"name", "newmeeting"},
		 {"start_date",_},
		 {"end_date","never"},
		 {"roster",{array, []}},
		 {"metadata",{struct, [{"description", "Meeting"}]}}]}}]} =
	tests_utils:get("/meeting/testorg/all/newmeeting", Params).

test_get_not_found_meeting([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
             , {"sid", RootSid}],
    {struct, [{"error", "not_found"}]} =
	tests_utils:get("/meeting/testorg/all/unexistentmeeting", Params).

test_get_not_found_org([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
             , {"sid", RootSid}],
    {struct, [{"error", "not_found"}]} =
	tests_utils:get("/meeting/unexistentorg/all/newmeeting", Params).

test_list_all([{RootUid, RootSid}, _]) ->
    Params = [{"uid", RootUid},
	      {"sid", RootSid}],
    JSON = tests_utils:get("/meeting/testorg/all", Params),
    test_meeting_in_list(["testorg", "testmeeting"], JSON),
    test_meeting_in_list(["testorg", "closedmeeting"], JSON),
    test_meeting_in_list(["testorg", "upcomingmeeting"], JSON).

test_list_upcoming([{RootUid, RootSid}, _]) ->
    Params = [{"uid", RootUid},
	      {"sid", RootSid}],
    JSON = tests_utils:get("/meeting/testorg/upcoming", Params),
    test_meeting_not_in_list(["testorg", "testmeeting"], JSON),
    test_meeting_not_in_list(["testorg", "closedmeeting"], JSON),
    test_meeting_in_list(["testorg", "upcomingmeeting"], JSON).

test_list_closed([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
	       , {"sid", RootSid}],
    JSON = tests_utils:get("/meeting/testorg/closed", Params),
    test_meeting_not_in_list(["testorg", "testmeeting"], JSON),
    test_meeting_in_list(["testorg", "closedmeeting"], JSON),
    test_meeting_not_in_list(["testorg", "upcomingmeeting"], JSON).

test_list_open([{RootUid, RootSid}, _]) ->
    Params = [{"uid", RootUid},
	      {"sid", RootSid}],
    JSON = tests_utils:get("/meeting/testorg/opened", Params),
    test_meeting_in_list(["testorg", "testmeeting"], JSON),
    test_meeting_not_in_list(["testorg", "closedmeeting"], JSON),
    test_meeting_not_in_list(["testorg", "upcomingmeeting"], JSON).

test_list_bad_parameters([{RootUid, RootSid}, _]) ->
    Params = [{"uid", RootUid},
	      {"sid", RootSid}],
    {struct, [{"error", "bad_parameters"}]} =
	tests_utils:get("/meeting/testorg/fishy_parameter", Params).

test_list_not_found([{RootUid, RootSid}, _]) ->
    Params = [{"uid", RootUid},
	      {"sid", RootSid}],
    {struct, [{"error", "not_found"}]} =
	tests_utils:get("/meeting/unexistentorg/opened", Params).

test_update([{RootUid, RootSid}, _]) ->
    Now = utils:now(),
    Params = [ {"uid", RootUid}
             , {"sid", RootSid}
	     , {"start", integer_to_list(Now)}
             , {"metadata[description]", "A new description"}],
    {struct, [{"result", "ok"}]} = tests_utils:post("/meeting/testorg/all/testmeeting", Params),
    {struct, [{"result",
	       {struct,
		[{"org", "testorg"},
		 {"name", "testmeeting"},
		 {"start_date", Now},
		 {"end_date","never"},
		 {"roster",{array, []}},
		 {"metadata",{struct, [{"description", "A new description"}]}}]}}]} =
	tests_utils:get("/meeting/testorg/all/testmeeting", Params).

test_update_not_found_meeting([{RootUid, RootSid}, _]) ->
    Now = integer_to_list(utils:now()),
    Params = [ {"uid", RootUid}
             , {"sid", RootSid}
	     , {"start", Now}
             , {"metadata[description]", "A new description"}],
    {struct, [{"error", "not_found"}]} =
	tests_utils:post("/meeting/testorg/all/unexistentmeeting", Params).

test_update_not_found_org([{RootUid, RootSid}, _]) ->
    Now = integer_to_list(utils:now()),
    Params = [ {"uid", RootUid}
             , {"sid", RootSid}
	     , {"start", Now}
             , {"metadata[description]", "A new description"}],
    {struct, [{"error", "not_found"}]} =
	tests_utils:post("/meeting/unexistentorg/all/testmeeting", Params).

test_update_bad_start([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
             , {"sid", RootSid}
	     , {"start", "i wish i was an integer"}
             , {"metadata[description]", "A new description"}],
    {struct, [{"error", "bad_parameters"}]} =
	tests_utils:post("/meeting/testorg/all/testmeeting", Params).

test_update_bad_end([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
             , {"sid", RootSid}
	     , {"end", "i wish i was an integer"}
             , {"metadata[description]", "A new description"}],
    {struct, [{"error", "bad_parameters"}]} =
	tests_utils:post("/meeting/testorg/all/testmeeting", Params).

test_update_unauthorized([_, {UglyUid, UglySid}]) ->
    Params = [ {"uid", UglyUid}
             , {"sid", UglySid}
	     , {"start", "0"}
             , {"metadata[description]", "Meeting"}],
    {struct, [{"error", "unauthorized"}]} =
	tests_utils:post("/meeting/testorg/all/testmeeting", Params).


test_join([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
	       , {"sid", RootSid}],

    {struct, [{"result", "ok"}]} =
	tests_utils:put("/meeting/testorg/all/testmeeting/roster/" ++ RootUid, Params),

    {struct, [{"result", {array, Array}}]} = 
	tests_utils:get("/meeting/testorg/all/testmeeting/roster", Params),
    [{struct,[{"uid",RootUid},
	      {"auth","password"},
	      {"metadata",{struct,[]}}]}] = Array.

test_join_not_found_meeting([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
	       , {"sid", RootSid}],
    {struct, [{"error", "not_found"}]} =
	tests_utils:put("/meeting/testorg/all/unexistentmeeting/roster/" ++ RootUid, Params).

test_join_not_found_org([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid},
	       {"sid", RootSid}],
    {struct, [{"error", "not_found"}]} =
	tests_utils:put("/meeting/unexistentorg/all/testmeeting/roster/" ++ RootUid, Params).

test_join_not_found_uid([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid},
	       {"sid", RootSid}],
    {struct, [{"error", "not_found"}]} =
	tests_utils:put("/meeting/testorg/all/testmeeting/roster/unexistentuid", Params).

test_join_unauthorized([_, {UglyUid, UglySid}]) ->
    Params = [{"uid", UglyUid},
	      {"sid", UglySid}],
    {struct, [{"error", "unauthorized"}]} =
	tests_utils:put("/meeting/testorg/all/testmeeting/roster/test.user@af83.com", Params).

test_leave([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
	       , {"sid", RootSid}],
    {struct, [{"result", "ok"}]} =
	tests_utils:delete("/meeting/testorg/all/testmeeting/roster/" ++ RootUid, Params),
    {struct, [{"result", {array, Array}}]} =
	tests_utils:get("/meeting/testorg/all/testmeeting/roster", Params),
    [] = Array.

test_leave_not_found_meeting([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
	       , {"sid", RootSid}],
    {struct, [{"error", "not_found"}]} =
	tests_utils:delete("/meeting/testorg/all/unexistentmeeting/roster/" ++ RootUid, Params).

test_leave_not_found_org([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
	       , {"sid", RootSid}
             ],
    {struct, [{"error", "not_found"}]} =
	tests_utils:delete("/meeting/unexistentorg/all/testmeeting/roster/" ++ RootUid, Params).

test_leave_not_found_uid([{RootUid, RootSid}, _]) ->
    Params = [ {"uid", RootUid}
	       , {"sid", RootSid}],
    {struct, [{"error", "not_found"}]} =
	tests_utils:delete("/meeting/org/all/testmeeting/roster/unexistentuid", Params).

test_leave_unauthorized([_, {UglyUid, UglySid}]) ->
    Params = [ {"uid", UglyUid},
	       {"sid", UglySid}],
    {struct, [{"error", "unauthorized"}]} =
	tests_utils:delete("/meeting/org/all/testmeeting/roster/test.user@af83.com", Params).

test_meeting_in_list(Id, {struct, [{"result", {array, List}}]}) ->
    test_meeting_in_list(Id, List);
test_meeting_in_list(Id, []) ->
    throw({not_found, Id});
test_meeting_in_list(Id, [Meeting|Tail]) ->
    {struct,
     [{"org", OrgName},
      {"name", MeetingName},
      {"start_date",_},
      {"end_date",_},
      {"roster",_},
      {"metadata",_}]} = Meeting,
    case Id of
	[OrgName, MeetingName] ->
	    true;
	_ ->
	    test_meeting_in_list(Id, Tail)
    end.

test_meeting_not_in_list(Id, JSON) ->
    case catch test_meeting_in_list(Id, JSON) of
	{not_found, _} ->
	    true;
	_ ->
	    throw({error, found})
    end.
