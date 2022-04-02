# Alyra Test Voting

## Unit tests
#### 35 tests valides 
Toutes les fonctions du contrat sont testées

1 file : VotingTest.js

## Logique de la découpe
Le fichier de test est découpé en deux blocs. Eux même divisé en sous blocs.
Le premier test la structure général d'un vote (Workflow Status) et les éléments de sécurité général (modifier).
Le second test une session de vote dans son ensemble.

### 1) Global elements
* Workflow Status
    * from RegisteringVoters to ProposalsRegistrationStarted
        - should pass
        - get event workflow status change
        - You shall not pass, revert
    * from ProposalsRegistrationStarted to ProposalsRegistrationEnded
        - should pass
        - get event workflow status change
        - You shall not pass, revert
    * from ProposalsRegistrationEnded to VotingSessionStarted
        - should pass
        - get event workflow status change
        - You shall not pass, revert
    * from VotingSessionStarted to VotingSessionEnded
        - should pass
        - get event workflow status change
        - You shall not pass, revert
* Safe Actions
    * only owner
        - can register a voter, revert
    * only registered voters
        - can add a proposal, revert
        - can add a vote, revert
### 2) Complete voting session
* Registering Voters
    - should store voter in mapping
    - get event voter registered
    - should not register the same voter, revert
    - should not register voter in wrong workflow, revert
    * when the votes have not started
        - should retrieve a specific voter registered
* Proposals Registration
    - should store proposal in array
    - get event proposal registered
    - should not store empty proposal, revert
    - should not store proposal in wrong workflow, revert
    * when the votes have not started
        - should retrieve a specific proposal stored
* Voting Session
    - should record vote choice
    - get event voted
    - should not register a vote for an unknown proposal, revert*
    - should not allow a voter to vote twice, revert
    - should not record a vote in wrong workflow, revert
    * when the votes have started
        - should retrieve an updated specific voter registered
        - should retrieve an updated specific proposal stored
* Votes Tallied
    - should give a tally of the votes
    - get event workflow status change automatic
    - should not record tally votes in wrong workflow, revert

*pour que se test fonction la ligne 98 `require(_id <= proposalsArray.length, 'Proposal not found');` 
du fichier .sol a dû est modifier. Suppression du `=`.
