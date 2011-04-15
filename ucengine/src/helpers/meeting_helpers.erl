%%
%%  U.C.Engine - Unified Colloboration Engine
%%  Copyright (C) 2011 af83
%%
%%  This program is free software: you can redistribute it and/or modify
%%  it under the terms of the GNU Affero General Public License as published by
%%  the Free Software Foundation, either version 3 of the License, or
%%  (at your option) any later version.
%%
%%  This program is distributed in the hope that it will be useful,
%%  but WITHOUT ANY WARRANTY; without even the implied warranty of
%%  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
%%  GNU Affero General Public License for more details.
%%
%%  You should have received a copy of the GNU Affero General Public License
%%  along with this program.  If not, see <http://www.gnu.org/licenses/>.
%%
-module(meeting_helpers).

-author('victor.goya@af83.com').

-include("uce.hrl").

-export([to_json/1, pretty_print/2]).

to_json(#uce_meeting{id={Name, Domain},
                     start_date=StartDate,
                     end_date=EndDate,
                     metadata=Metadata}) ->
    {struct, [{name, Name},
              {domain, Domain},
              {start_date, StartDate},
              {end_date, case EndDate of
                             ?NEVER_ENDING_MEETING ->
                                 "never";
                             _ ->
                                 integer_to_list(EndDate)
                         end},
              {metadata, {struct, Metadata}}]}.

pretty_print(Meetings, Format)
  when is_list(Meetings) ->
    lists:flatten([pretty_print(Meeting, Format) ++ "--~n" || Meeting <- Meetings]);
pretty_print(#uce_meeting{id={Id, _Domain},
                          start_date=Start,
                          end_date=End,
                          roster=_Roster,
                          metadata=Metadata}, flat) ->
    Out = [io_lib:format("Id: ~s~n", [Id]),
           io_lib:format("Start: ~p~n", [Start]),
           io_lib:format("End: ~p~n", [End])],
    StrMetadata =
        if
            Metadata == [] ->
                ["Metadata: none~n"];
            true ->
                [io_lib:format("Metadata:~n", [])] ++
                    [ io_lib:format("\t~s: ~s~n", [Key, Value]) || {Key, Value} <- Metadata ]
        end,
    lists:flatten(Out ++ StrMetadata).