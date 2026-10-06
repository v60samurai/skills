Transcript of the status page call, auto-generated, lightly cleaned. Package it for the infra team.

Rhea: hi hi, can you hear me? I think I'm on the wrong headset. One sec.
Colm: we can hear you.
Rhea: ok good. Sorry. Ok. So. Status page. Colm, you wanted to talk about the status page.
Colm: yes. So the thing is, the status page said everything was green during the outage on the 9th. For forty minutes. Customers were tweeting at us and the page said all systems operational.
Rhea: right. Forty minutes.
Colm: forty minutes of green while checkout was down.
Wes: just so I understand, the page was green the whole time?
Colm: the whole time. Forty minutes. Because the status page is updated by hand. Somebody has to go in and flip it. And everybody was busy fixing the outage.
Rhea: so nobody flipped it.
Colm: nobody flipped it. It's manual.
Wes: it's manual. Ok. I didn't know it was manual.
Colm: it's manual. It has always been manual.
Rhea: ok so what do we want. I'm the one who has to sign off on this since the page is mine. What do we want.
Colm: I want it automatic. If the checkout health check fails, the page goes red. By itself.
Wes: how long does it have to fail? Because the check flaps. It fails for like ten seconds sometimes and comes back.
Colm: good point. Not on one failure.
Wes: yeah not on one failure. It flaps.
Rhea: so some number of failures in a row.
Colm: three. Three consecutive failures. The check runs every minute so that's three minutes.
Wes: three in a row, three minutes. I can live with that.
Rhea: three consecutive failures, one minute apart. Ok. I'm fine with that. Let's do that. Decision. Three consecutive failed checks flips the component to "Degraded" automatically.
Colm: degraded, not down?
Rhea: degraded. I don't want a robot declaring us down. A human sets "Major outage". The robot only sets "Degraded".
Colm: ok. Fair. Robot sets degraded, human sets major outage.
Wes: so automatic degraded, manual outage.
Rhea: yes. Automatic degraded, manual major outage. That's the decision.
Wes: and how does it go back to green?
Colm: automatically too? When the check passes again?
Rhea: hmm. How many passes?
Wes: it flaps the other way too. It'll pass once in the middle of an incident.
Colm: five. Five consecutive passes.
Rhea: five passes in a row, back to operational. Ok. Yes. Decided.
Wes: five passes, so five minutes of healthy.
Rhea: five minutes of healthy and it goes back by itself. Unless a human set major outage, then a human has to clear it.
Colm: right, the robot doesn't clear a human's status.
Rhea: the robot never clears a human's status. Write that down.
Wes: writing it down. Robot doesn't override a human.
Colm: can we talk about which components? Because right now I only said checkout.
Rhea: start with checkout. Just checkout.
Colm: I'd like search and login too.
Rhea: maybe. Later. I want to see it work on checkout first. Let's not decide search and login today.
Colm: ok so checkout only for now, search and login is a maybe.
Rhea: it's a maybe. Checkout only is decided.
Wes: sorry, my dog. One second. Ok I'm back. What did I miss?
Colm: checkout only for now.
Wes: checkout only. Ok. And it's the existing health check? The one at /healthz/checkout?
Colm: yes, the existing one. `GET /healthz/checkout`. It runs every 60 seconds from the monitoring box.
Wes: from one box? One region?
Colm: one region. Frankfurt.
Wes: so if Frankfurt has a network blip the page goes degraded for everyone.
Colm: ...yes. That is a problem.
Rhea: is it a problem we have to solve now?
Wes: I think we should check from two regions and only flip if both fail.
Colm: that's more work. The second prober doesn't exist.
Rhea: I don't know. Wes, that's your suggestion, I'm not saying yes or no. Find out how much work a second region is.
Wes: ok. I'll find out. So that's open.
Rhea: that's open. One region or two is open.
Colm: also the status page vendor, we need an API key for their API to flip things automatically. We don't have one. Only the manual login.
Rhea: who gets that?
Colm: I'll ask the vendor. It might be on a higher plan.
Rhea: so we might have to pay more.
Colm: we might have to pay more. I don't know yet.
Rhea: ok. So that's a dependency. API access from the vendor, Colm is asking, might need a plan upgrade.
Wes: and should it post in the incidents channel when it flips?
Rhea: oh. Yes. It must. If the robot changes the page I want a message in #incidents saying so. Every time. Both directions.
Colm: both directions, so when it goes degraded and when it goes back.
Rhea: both. That's a requirement from me.
Wes: got it. Message in #incidents on every automatic change.
Rhea: ok I have a hard stop. Let me say it all back. Automatic degraded after three failed checks. Automatic back to operational after five passed checks. Robot never sets major outage and never clears a human's status. Checkout only. Message in #incidents on every automatic change. Open: one region or two, Wes is finding out. Dependency: vendor API key, Colm is asking. Search and login is a maybe for later.
Colm: yes. That's it.
Wes: that's it. Three and five.
Rhea: three and five. Ok. Thanks both. Bye.
Colm: bye.
Wes: bye, sorry about the dog.
