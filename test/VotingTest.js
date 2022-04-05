const Voting = artifacts.require('./Voting.sol');
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
contract('Voting', accounts => {
	const account = {
		owner: accounts[0],
		firstVoter: accounts[1],
		secondVoter: accounts[2],
		thirdVoter: accounts[3],
		notRegistered: accounts[4]
	}
	let VotingInstance, voter, proposal, vote, tally;
	
	describe('Global elements', () => {
		describe('Workflow Status', () =>{
			before(async () => {
				VotingInstance = await Voting.new({from: account.owner});
			});
			let status;
			context('from RegisteringVoters to ProposalsRegistrationStarted', async () => {
				it('should pass',async () =>{
					status = await VotingInstance.startProposalsRegistering({from: account.owner});
					expect(status).to.be.ok;
				});
				it('get event workflow status change', () =>{
					expectEvent(status, 'WorkflowStatusChange', {previousStatus: new BN(0), newStatus: new BN(1)});
				});
				it('You shall not pass, revert', async () => {
					await expectRevert(VotingInstance.startProposalsRegistering({from: account.owner}), 'Registering proposals cant be started now');
				});
			});
			context('from ProposalsRegistrationStarted to ProposalsRegistrationEnded', async () => {
				it('should pass', async () =>{
					status = await VotingInstance.endProposalsRegistering({from: account.owner});
					expect(status).to.be.ok;
				});
				it('get event workflow status change', () =>{
					expectEvent(status, 'WorkflowStatusChange', {previousStatus: new BN(1), newStatus: new BN(2)});
				});
				it('You shall not pass, revert', async () => {
					await expectRevert(VotingInstance.startProposalsRegistering({from: account.owner}), 'Registering proposals cant be started now');
				});
			});
			context('from ProposalsRegistrationEnded to VotingSessionStarted', () => {
				it('should pass',async () =>{
					status = await VotingInstance.startVotingSession({from: account.owner});
					expect(status).to.be.ok;
				});
				it('get event workflow status change', () =>{
					expectEvent(status, 'WorkflowStatusChange', {previousStatus: new BN(2), newStatus: new BN(3)});
				});
				it('You shall not pass, revert', async () => {
					await expectRevert(VotingInstance.startProposalsRegistering({from: account.owner}), 'Registering proposals cant be started now');
				});
			});
			context('from VotingSessionStarted to VotingSessionEnded', async () => {
				it('should pass',async () =>{
					status = await VotingInstance.endVotingSession({from: account.owner});
					expect(status).to.be.ok;
				});
				it('get event workflow status change', () =>{
					expectEvent(status, 'WorkflowStatusChange', {previousStatus: new BN(3), newStatus: new BN(4)});
				});
				it('You shall not pass, revert', async () => {
					await expectRevert(VotingInstance.startProposalsRegistering({from: account.owner}), 'Registering proposals cant be started now');
				});
			});
		});
		describe('Safe Actions', () => {
			before(async () => {
				VotingInstance = await Voting.new({from: account.owner});
			});
			context('only owner', () => {
				it('can register a voter, revert',async () => {
					await expectRevert(VotingInstance.addVoter(account.secondVoter, {from: account.firstVoter}), 'Ownable: caller is not the owner');
				});
			});
			context('only registered voters' , () => {
				it('can add a proposal, revert',async () => {
					await VotingInstance.startProposalsRegistering({from: account.owner});
					await expectRevert(VotingInstance.addProposal('Proposal One', {from: account.notRegistered}), 'You\'re not a voter');
				});
				it('can add a vote, revert',async () => {
					await VotingInstance.endProposalsRegistering({from: account.owner});
					await VotingInstance.startVotingSession({from: account.owner});
					await expectRevert(VotingInstance.setVote(new BN(0), {from: account.notRegistered}), 'You\'re not a voter');
				});
			});
		});
	});
	describe('Complete voting session', () => {
		before(async () => {
			VotingInstance = await Voting.new({from: account.owner});
		});
		describe('Registering Voters', () => {
			it('should store voter in mapping', async () => {
				voter = await VotingInstance.addVoter(account.firstVoter, {from: account.owner});
				await VotingInstance.addVoter(account.secondVoter, {from: account.owner});
				await VotingInstance.addVoter(account.thirdVoter, {from: account.owner});
				expect(voter).to.be.ok;
			});
			it('get event voter registered', () =>{
				expectEvent(voter, 'VoterRegistered', {voterAddress:account.firstVoter});
			});
			it('should not register the same voter, revert', async () => {
				await expectRevert(VotingInstance.addVoter(account.firstVoter, {from: account.owner}), 'Already registered');
			});
			it('should not register voter in wrong workflow, revert', async () => {
				await VotingInstance.startProposalsRegistering({from: account.owner});
				await expectRevert(VotingInstance.addVoter(account.notRegistered, {from: account.owner}), 'Voters registration is not open yet');
			});
			context('when the votes have not started', function() {
				it('should retrieve a specific voter registered', async () => {
					const {isRegistered, hasVoted, votedProposalId} = await VotingInstance.getVoter.call(account.secondVoter, {from: account.firstVoter});
					expect(isRegistered).to.be.true;
					expect(hasVoted).to.be.false;
					expect(new BN(votedProposalId)).to.be.bignumber.equal(new BN(0));
				})
			});
		});
		describe('Proposals Registration', () => {
			it('should store proposal in array', async () => {
				proposal = await VotingInstance.addProposal('Proposal One', {from: account.firstVoter});
				await VotingInstance.addProposal('Proposal Two', {from: account.secondVoter});
				expect(proposal).to.be.ok;
			});
			it('get event proposal registered', () =>{
				expectEvent(proposal, 'ProposalRegistered', {proposalId: new BN(0)});
			});
			it('should not store empty proposal, revert', async () => {
				await expectRevert(VotingInstance.addProposal("", {from: account.firstVoter}), 'Vous ne pouvez pas ne rien proposer');
			});
			it('should not store proposal in wrong workflow, revert', async () => {
				await VotingInstance.endProposalsRegistering({from: account.owner});
				await expectRevert(VotingInstance.addProposal('Proposal One', {from: account.firstVoter}), 'Proposals are not allowed yet');
			});
			context('when the votes have not started', function() {
				it('should retrieve a specific proposal stored', async () => {
					const {description, voteCount} = await VotingInstance.getOneProposal.call(new BN(1), {from: account.firstVoter});
					expect(description).to.equal('Proposal Two');
					expect(new BN(voteCount)).to.be.bignumber.equal(new BN(0));
				})
			});
		});
		describe('Voting Session', () => {
			it('should record vote choice', async () => {
				await VotingInstance.startVotingSession({from: account.owner});
				vote = await VotingInstance.setVote(new BN(1), {from: account.firstVoter});
				await VotingInstance.setVote(new BN(1), {from: account.secondVoter});
				expect(vote).to.be.ok;
			});
			it('get event voted', () =>{
				expectEvent(vote, 'Voted', {voter: account.firstVoter, proposalId: new BN(1)});
			});
			it('should not register a vote for an unknown proposal, revert', async () => {
				await expectRevert(VotingInstance.setVote(new BN(2), {from: account.thirdVoter}), 'Proposal not found');
			});
			it('should not allow a voter to vote twice, revert', async () => {
				await expectRevert(VotingInstance.setVote(new BN(1), {from: account.firstVoter}), 'You have already voted');
			});
			it('should not record a vote in wrong workflow, revert', async () => {
				await VotingInstance.endVotingSession({from: account.owner});
				await expectRevert(VotingInstance.setVote(new BN(1), {from: account.firstVoter}), 'Voting session havent started yet');
			});
			context('when the votes have started', function() {
				it('should retrieve an updated specific voter registered', async () => {
					const {isRegistered, hasVoted, votedProposalId} = await VotingInstance.getVoter.call(account.secondVoter, {from: account.firstVoter});
					expect(isRegistered).to.be.true;
					expect(hasVoted).to.be.true;
					expect(new BN(votedProposalId)).to.be.bignumber.equal(new BN(1));
				})
				it('should retrieve an updated specific proposal stored', async () => {
					const {description, voteCount} = await VotingInstance.getOneProposal.call(new BN(1), {from: account.firstVoter});
					expect(description).to.equal('Proposal Two');
					expect(new BN(voteCount)).to.be.bignumber.equal(new BN(2));
				})
			});
		})
		describe('Votes Tallied', () => {
			it('should give a tally of the votes', async () => {
				tally = await VotingInstance.tallyVotes({from: account.owner});
				expect(tally).to.be.ok;
			});
			it('get event workflow status change automatic', () =>{
				expectEvent(tally, 'WorkflowStatusChange', {previousStatus: new BN(4), newStatus: new BN(5)});
			});
			it('should not record tally votes in wrong workflow, revert', async () => {
				await expectRevert(VotingInstance.tallyVotes({from: account.owner}), 'Current status is not voting session ended');
			});
		});

	});
});