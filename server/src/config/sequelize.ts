import dotenv from 'dotenv';
import pg from 'pg';
import { Sequelize } from 'sequelize';
import { initCommunityModel } from '../models/Community.js';
import {
    initCommunityMemberModel,
    setupCommunityMemberAssociations,
} from '../models/CommunityMember.js';
import {
    initCommunityEventModel,
    setupCommunityEventAssociations,
} from '../models/CommunityEvent.js';
import {
    initCommunityEventRsvpModel,
    setupCommunityEventRsvpAssociations,
} from '../models/CommunityEventRsvp.js';
import {
    initCommunityChallengeModel,
    setupCommunityChallengeAssociations,
} from '../models/CommunityChallenge.js';
import {
    initCommunityChallengeContributionModel,
    setupCommunityChallengeContributionAssociations,
} from '../models/CommunityChallengeContribution.js';
import {
    initCommunityInviteModel,
    setupCommunityInviteAssociations,
} from '../models/CommunityInvite.js';
import { initJogoModel } from '../models/Jogo.js';
import { initPostModel } from '../models/Post.js';
import { initUserModel, setupUserFollowScopes } from '../models/User.js';
import {
    initUserFollowModel,
    setupUserFollowAssociations,
} from '../models/UserFollow.js';
import { initUserRatingModel } from '../models/UserRating.js';

dotenv.config();

export const sequelize = new Sequelize(
    process.env.DB_NAME ?? 'opinion',
    process.env.DB_USER ?? 'postgres',
    process.env.DB_PASSWORD ?? 'password',
    {
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        dialect: 'postgres',
        dialectModule: pg,
        logging: false,
    },
);

initUserModel(sequelize);
initUserFollowModel(sequelize);
initJogoModel(sequelize);
initPostModel(sequelize);
initUserRatingModel(sequelize);
initCommunityModel(sequelize);
initCommunityMemberModel(sequelize);
initCommunityEventModel(sequelize);
initCommunityEventRsvpModel(sequelize);
initCommunityChallengeModel(sequelize);
initCommunityChallengeContributionModel(sequelize);
initCommunityInviteModel(sequelize);

setupUserFollowAssociations();
setupUserFollowScopes();
setupCommunityMemberAssociations();
setupCommunityEventAssociations();
setupCommunityEventRsvpAssociations();
setupCommunityChallengeAssociations();
setupCommunityChallengeContributionAssociations();
setupCommunityInviteAssociations();
