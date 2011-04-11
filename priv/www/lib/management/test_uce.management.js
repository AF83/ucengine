module("uce.management", {teardown: function() {
    $('#management').management('destroy');
}});

Factories.addRosterEvent = function(from) {
    return {
        type: "internal.roster.add",
        from: from
    };
}

Factories.updateNicknameEvent = function(from, nickname) {
    return {
        type: "roster.nickname.update",
        from: from,
        metadata: {nickname: nickname}
    };
}

Factories.addUserRoleEvent = function(from, user, role) {
    return {
        type: "internal.user.role.add",
        from: from,
        metadata: {user: user,
                   role: role}
    };
}

Factories.deleteUserRoleEvent = function(from, user, role) {
    return {
        type: "internal.user.role.delete",
        from: from,
        metadata: {user: user,
                   role: role}
    };
}

Factories.requestLeadEvent = function(from) {
    return {
        type: "meeting.lead.request",
        from: from,
        metadata: {}
    };
}

Factories.refuseLeadEvent = function(from, user) {
    return {
        type: "meeting.lead.refuse",
        from: from,
        metadata: {user: user}
    };
}

Factories.deleteRosterEvent = function(from) {
    return {
        type: "internal.roster.delete",
        from: from
    };
}

test("create some elements", function() {
    $('#management').management();
    ok($('#management').hasClass("ui-management"), "should have class ui-management");
    ok($('#management').hasClass("ui-widget"), "should have class ui-widget");
    equals($('#management').children().size(), 2);
    equals($("#management .ui-widget-content").children().size(), 4);
});

test("destroy delete all elements", function() {
    $('#management').management();
    $('#management').management("destroy");
    ok(!$('#management').hasClass("ui-management"), "should not have class ui-management");
    ok(!$('#management').hasClass("ui-widget"), "should not have class ui-widget");
    equals($('#management > *').size(), 0);
});

module("uce.management", {
    setup: function() {
        var that = this;
        this.ucemeeting = {
            name: "testmeeting",
            on: function(eventName, callback) {
                if (eventName == "internal.roster.add") {
                    that.callback_roster_add = callback;
                } else if (eventName == "internal.roster.delete") {
                    that.callback_roster_delete = callback;
                } else if (eventName == "internal.user.role.add") {
                    that.callback_role_add = callback;
                } else if (eventName == "internal.user.role.delete") {
                    that.callback_role_delete = callback;
                } else if (eventName == "meeting.lead.request") {
                    that.callback_lead_request = callback;
                } else if (eventName == "meeting.lead.refuse") {
                    that.callback_lead_refuse = callback;
                } else if (eventName == "roster.nickname.update") {
                    that.callback_nickname_update = callback;
                }
            }
        };
        $('#management').management({
            ucemeeting: this.ucemeeting,
            uceclient: {uid: 'chuck'},
            dock: '#management-dock',
            url: 'my sweet url',
            code: '1234'
        });
    },
    teardown: function() {
        $('#management').management('destroy');
    }});

test("clear the widget", function() {
    $('#management').management('clear');
    equals($("#management .ui-management-roster").children().size(), 0);
});

test("handle join", function() {
    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    equals($("#management .ui-management-roster").children().size(), 1);
    equals($("#management .ui-management-roster li:eq(0) .ui-management-user").text(), 'Unnamed 1');
});

test("handle duplicate participant", function() {
    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    equals($("#management .ui-management-roster").children().size(), 1);
    equals($("#management .ui-management-roster li:eq(0) .ui-management-user").text(), 'Unnamed 1');
});

test("handle leave", function() {
    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    equals($("#management .ui-management-roster").children().size(), 1);
    equals($("#management .ui-management-roster li:eq(0) .ui-management-user").text(), 'Unnamed 1');

    this.callback_roster_delete(Factories.deleteRosterEvent('chuck'));
    equals($("#management .ui-management-roster").children().size(), 0);
});

test("handle internal.user.role.add event", function() {
    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    equals($("#management .ui-management-roster").children().size(), 1);
    equals($("#management .ui-management-roster li:eq(0) .ui-management-user").text(), 'Unnamed 1');
    equals($("#management .ui-management-roster li:eq(0) .ui-management-role").text(), 'You');

    this.callback_role_add(Factories.addUserRoleEvent('god', 'chuck', 'speaker'));
    equals($("#management .ui-management-roster").children().size(), 1);
    equals($("#management .ui-management-roster li:eq(0) .ui-management-user").text(), 'Unnamed 1');
    equals($("#management .ui-management-roster li:eq(0) .ui-management-role").text(), 'Speaker');
});

test("handle internal.user.role.delete event", function() {
    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    this.callback_role_add(Factories.addUserRoleEvent('god', 'chuck', 'speaker'));
    equals($("#management .ui-management-roster").children().size(), 1);
    equals($("#management .ui-management-roster li:eq(0) .ui-management-user").text(), 'Unnamed 1');
    equals($("#management .ui-management-roster li:eq(0) .ui-management-role").text(), 'Speaker');
    this.callback_role_delete(Factories.deleteUserRoleEvent('god', 'chuck', 'speaker'));
    equals($("#management .ui-management-roster").children().size(), 1);
    equals($("#management .ui-management-roster li:eq(0) .ui-management-user").text(), 'Unnamed 1');
    equals($("#management .ui-management-roster li:eq(0) .ui-management-role").text(), 'You');
});

test("show the number of users", function() {
    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    this.callback_roster_add(Factories.addRosterEvent('brucelee'));
    equals($("#management .ui-management-roster-header h1").text(), 'Connected users (2)');

    this.callback_roster_delete(Factories.deleteRosterEvent('chuck'));
    equals($("#management .ui-management-roster-header h1").text(), 'Connected users (1)');
});

test("sort roster correctly", function() {
    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    this.callback_roster_add(Factories.addRosterEvent('speaker'));
    this.callback_roster_add(Factories.addRosterEvent('participant1'));
    this.callback_roster_add(Factories.addRosterEvent('participant2'));
    this.callback_roster_add(Factories.addRosterEvent('owner'));

    this.callback_role_add(Factories.addUserRoleEvent('god', 'owner', 'owner'));
    this.callback_role_add(Factories.addUserRoleEvent('god', 'speaker', 'speaker'));

    this.callback_nickname_update(Factories.updateNicknameEvent('chuck', 'Z'));
    this.callback_nickname_update(Factories.updateNicknameEvent('speaker', 'Y'));
    this.callback_nickname_update(Factories.updateNicknameEvent('participant1', 'B'));
    this.callback_nickname_update(Factories.updateNicknameEvent('participant2', 'A'));
    this.callback_nickname_update(Factories.updateNicknameEvent('owner', 'X'));

    equals($("#management .ui-management-roster").children().size(), 5);
    equals($("#management .ui-management-roster li:eq(0) .ui-management-user").text(), 'Z');
    equals($("#management .ui-management-roster li:eq(0) .ui-management-role").text(), 'You');
    equals($("#management .ui-management-roster li:eq(1) .ui-management-user").text(), 'X');
    equals($("#management .ui-management-roster li:eq(1) .ui-management-role").text(), 'Owner');
    equals($("#management .ui-management-roster li:eq(2) .ui-management-user").text(), 'Y');
    equals($("#management .ui-management-roster li:eq(2) .ui-management-role").text(), 'Speaker');
    equals($("#management .ui-management-roster li:eq(3) .ui-management-user").text(), 'A');
    equals($("#management .ui-management-roster li:eq(3) .ui-management-role").text(), '');
    equals($("#management .ui-management-roster li:eq(4) .ui-management-user").text(), 'B');
    equals($("#management .ui-management-roster li:eq(4) .ui-management-role").text(), '');
});

test("handle roster.nickame.update event", function() {
    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    this.callback_nickname_update(Factories.updateNicknameEvent('chuck', 'Chuck Norris'));
    equals($("#management .ui-management-roster").children().size(), 1);
    equals($("#management .ui-management-roster li:eq(0) .ui-management-user").text(), 'Chuck Norris');
});

jackTest("push a roster.nickname.update event after changing our nickname", function() {
    var ucemeeting = jack.create("ucemeeting", ['push']);
    jack.expect("ucemeeting.push")
        .exactly("1 time")
        .mock(function(type, metadata) {
            equals(type, "roster.nickname.update");
            equals(metadata.nickname, "Chuck Norris");
        });
    ucemeeting.on = this.ucemeeting.on;

    $('#management').management({
        ucemeeting: ucemeeting,
        uceclient: {uid: 'chuck'}
    });

    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    equals($("#management .ui-management-roster li:eq(0) .ui-management-user").text(), 'Unnamed 1');
    $("#management .ui-management-roster li:eq(0) .ui-management-user").click();
    $("#management .ui-management-roster li:eq(0) .ui-management-user input").val("Chuck Norris");
    $("#management .ui-management-roster li:eq(0) .ui-management-user input").trigger("blur");
});

jackTest("don't push an event if setting the same nickname or an empty nickname", function() {
    var ucemeeting = jack.create("ucemeeting", ['push']);
    jack.expect("ucemeeting.push")
        .exactly("1 time");
    ucemeeting.on = this.ucemeeting.on;

    $('#management').management({
        ucemeeting: ucemeeting,
        uceclient: {uid: 'chuck'}
    });

    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    equals($("#management .ui-management-roster li:eq(0) .ui-management-user").text(), 'Unnamed 1');
    $("#management .ui-management-roster li:eq(0) .ui-management-user").click();
    $("#management .ui-management-roster li:eq(0) .ui-management-user input").val("Chuck Norris");
    $("#management .ui-management-roster li:eq(0) .ui-management-user input").trigger("blur");

    $("#management .ui-management-roster li:eq(0) .ui-management-user").click();
    $("#management .ui-management-roster li:eq(0) .ui-management-user input").val("Chuck Norris");
    $("#management .ui-management-roster li:eq(0) .ui-management-user input").trigger("blur");

    $("#management .ui-management-roster li:eq(0) .ui-management-user").click();
    $("#management .ui-management-roster li:eq(0) .ui-management-user input").val("");
    $("#management .ui-management-roster li:eq(0) .ui-management-user input").trigger("blur");
    equals($("#management .ui-management-roster li:eq(0) .ui-management-user").text(), 'Chuck Norris');
});

jackTest("send a chat.private.start event when clicking on a user", function() {
    expect(3);
    var ucemeeting = jack.create("ucemeeting", ['trigger']);
    jack.expect("ucemeeting.trigger")
        .exactly("1 time")
        .mock(function(event) {
            equals(event.type, "chat.private.start");
            equals(event.metadata.interlocutor, "brucelee");
        });
    ucemeeting.on = this.ucemeeting.on;

    $('#management').management({
        ucemeeting: ucemeeting,
        uceclient: {uid: 'chuck'}
    });

    this.callback_roster_add(Factories.addRosterEvent('brucelee'));
    $("#management .ui-management-roster li:eq(0) .ui-management-user").click();
});

jackTest("send a meeting.lead.request event when clicking on the 'Request Lead' button", function() {
    expect(2);
    var ucemeeting = jack.create("ucemeeting", ['push']);
    jack.expect("ucemeeting.push")
        .exactly("1 time")
        .mock(function(type) {
            equals(type, "meeting.lead.request");
        });
    ucemeeting.on = this.ucemeeting.on;

    $('#management').management({
        ucemeeting: ucemeeting,
        uceclient: {uid: 'chuck'}
    });

    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    $("#management .ui-management-roster li:eq(0) .ui-management-lead-button").click();
});

test("display a message after a meeting.lead.request is received from us", function() {
    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    this.callback_lead_request(Factories.requestLeadEvent('chuck'));
    equals($("#management .ui-management-roster li:eq(0) .ui-management-role").text(), 'Lead Request Pending');
});

test("display a choice after a meeting.lead.request is sent to the owner", function() {
    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    this.callback_role_add(Factories.addUserRoleEvent('god', 'chuck', 'owner'));

    this.callback_roster_add(Factories.addRosterEvent('brucelee'));
    this.callback_lead_request(Factories.requestLeadEvent('brucelee'));

    equals($("#management .ui-management-roster li:eq(1) .ui-management-lead-button").size(), 2);
    ok($("#management .ui-management-roster li:eq(1) .ui-management-lead-button:eq(0) span").hasClass('ui-icon-circle-close'));
    ok($("#management .ui-management-roster li:eq(1) .ui-management-lead-button:eq(1) span").hasClass('ui-icon-circle-check'));
});

jackTest("send a meeting.lead.refuse event when clicking on the refusal pictogram", function() {
    expect(3);
    var ucemeeting = jack.create("ucemeeting", ['push']);
    jack.expect("ucemeeting.push")
        .exactly("1 time")
        .mock(function(type, metadata) {
            equals(type, "meeting.lead.refuse");
            equals(metadata.user, "brucelee");
        });
    ucemeeting.on = this.ucemeeting.on;

    $('#management').management({
        ucemeeting: ucemeeting,
        uceclient: {uid: 'chuck'}
    });

    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    this.callback_role_add(Factories.addUserRoleEvent('god', 'chuck', 'owner'));

    this.callback_roster_add(Factories.addRosterEvent('brucelee'));
    this.callback_lead_request(Factories.requestLeadEvent('brucelee'));

    $("#management .ui-management-roster li:eq(1) .ui-management-lead-button:eq(0)").click();
});

test("display back the 'Lead Request' button after the user received a meeting.lead.refuse event", function() {
    this.callback_roster_add(Factories.addRosterEvent('chuck'));

    this.callback_roster_add(Factories.addRosterEvent('brucelee'));
    this.callback_role_add(Factories.addUserRoleEvent('god', 'brucelee', 'owner'));

    this.callback_lead_request(Factories.requestLeadEvent('chuck'));
    equals($("#management .ui-management-roster li:eq(0) .ui-management-role").text(), 'Lead Request Pending');

    this.callback_lead_refuse(Factories.refuseLeadEvent('brucelee', 'chuck'));
    equals($("#management .ui-management-roster li:eq(0) .ui-management-role").text(), 'You');
});

test("ignore meeting.lead.refuse event from non-owner", function() {
    this.callback_roster_add(Factories.addRosterEvent('chuck'));

    this.callback_roster_add(Factories.addRosterEvent('brucelee'));

    this.callback_lead_request(Factories.requestLeadEvent('chuck'));
    equals($("#management .ui-management-roster li:eq(0) .ui-management-role").text(), 'Lead Request Pending');

    this.callback_lead_refuse(Factories.refuseLeadEvent('brucelee', 'chuck'));
    equals($("#management .ui-management-roster li:eq(0) .ui-management-role").text(), 'Lead Request Pending');
});

jackTest("add the 'speaker' role when clicking on the 'Give Lead' button", function() {
    expect(7);
    var userMock = jack.create("user", ['addRole', 'delRole']);
    jack.expect("user.addRole")
        .exactly("1 time")
        .mock(function(uid, role, location, callback) {
            equals(uid, "brucelee");
            equals(role, "speaker");
            equals(location, "testmeeting");
        });
    jack.expect("user.delRole")
        .exactly("1 time")
        .mock(function(uid, role, location, callback) {
            equals(uid, "jcvd");
            equals(role, "speaker");
            equals(location, "testmeeting");
        });
    uceclient = {uid: "chuck", user: userMock};

    $('#management').management({
        ucemeeting: this.ucemeeting,
        uceclient: uceclient
    });

    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    this.callback_role_add(Factories.addUserRoleEvent('god', 'chuck', 'owner'));

    this.callback_roster_add(Factories.addRosterEvent('jcvd'));
    this.callback_role_add(Factories.addUserRoleEvent('god', 'jcvd', 'speaker'));

    this.callback_roster_add(Factories.addRosterEvent('brucelee'));

    $("#management .ui-management-roster li:eq(2) .ui-management-lead-button").click();
});

jackTest("add the 'speaker' role when clicking on the accept pictogram", function() {
    expect(7);
    var userMock = jack.create("user", ['addRole', 'delRole']);
    jack.expect("user.addRole")
        .exactly("1 time")
        .mock(function(uid, role, location, callback) {
            equals(uid, "brucelee");
            equals(role, "speaker");
            equals(location, "testmeeting");
        });
    jack.expect("user.delRole")
        .exactly("1 time")
        .mock(function(uid, role, location, callback) {
            equals(uid, "jcvd");
            equals(role, "speaker");
            equals(location, "testmeeting");
        });

    var uceclient = {uid: "chuck", user: userMock};
    var ucemeeting = jack.create("ucemeeting", ['push']);
    ucemeeting.on = this.ucemeeting.on;
    ucemeeting.name = this.ucemeeting.name;

    $('#management').management({
        ucemeeting: ucemeeting,
        uceclient: uceclient
    });

    this.callback_roster_add(Factories.addRosterEvent('chuck'));
    this.callback_role_add(Factories.addUserRoleEvent('god', 'chuck', 'owner'));

    this.callback_roster_add(Factories.addRosterEvent('jcvd'));
    this.callback_role_add(Factories.addUserRoleEvent('god', 'jcvd', 'speaker'));

    this.callback_roster_add(Factories.addRosterEvent('brucelee'));
    this.callback_lead_request(Factories.requestLeadEvent('brucelee'));

    $("#management .ui-management-roster li:eq(2) .ui-management-lead-button:eq(1)").click();
});

test("Switch between views when clicking on the invite or roster link", function() {
    var ucemeeting = jack.create("ucemeeting", ['push']);
    ucemeeting.on = this.ucemeeting.on;
    ucemeeting.name = this.ucemeeting.name;

    $('#management').management({
        ucemeeting: ucemeeting,
        uceclient: {uid: 'chuck'}
    });

    equals($('#management .ui-management-roster-header').css('display'), 'block');
    equals($('#management .ui-management-roster').css('display'), 'block');
    equals($('#management .ui-management-invite-header').css('display'), 'none');
    equals($('#management .ui-management-invite').css('display'), 'none');

    $('#management .ui-management-invite-link').click();

    equals($('#management .ui-management-roster-header').css('display'), 'none');
    equals($('#management .ui-management-roster').css('display'), 'none');
    equals($('#management .ui-management-invite-header').css('display'), 'block');
    equals($('#management .ui-management-invite').css('display'), 'block');

    $('#management .ui-management-roster-link').click();

    equals($('#management .ui-management-roster-header').css('display'), 'block');
    equals($('#management .ui-management-roster').css('display'), 'block');
    equals($('#management .ui-management-invite-header').css('display'), 'none');
    equals($('#management .ui-management-invite').css('display'), 'none');
});

test("Give an url and a code to the widget so the fields will be pre-filled", function() {
    equals($('#management .ui-management-url').val(), 'my sweet url');
    equals($('#management .ui-management-code').val(), '1234');
});
