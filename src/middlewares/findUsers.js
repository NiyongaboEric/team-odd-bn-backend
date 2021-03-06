import Response from '../helpers/Response';
import {
  users, tripRequests, userProfile, comments, trips
} from '../database/models';
import CommonQueries from '../services/CommonQueries';

const findOneUser = async (req, res, next) => {
  const { email } = req.body;
  const isUserExist = await users.findOne({ where: { email } });

  if (isUserExist) {
    return res.status(409).json({ error: 'User already exist' });
  }
  next();
};

export const IsOwnerOfTrip = async (req, res, next) => {
  const isManager = await CommonQueries.findOne(userProfile, { where: { userId: req.row.userId, managerId: req.user.id } });
  if (req.user.id !== req.row.userId && !isManager) {
    return Response.errorMessage(req, res, 'You are not the owner of the trip', 409);
  }
  next();
};

export const IsTripApproved = async (req, res, next) => {
  if (req.row.statusId === 2) {
    return Response.errorMessage(req, res, 'The trip is already approved', 409);
  }
  next();
};


export const commentAccess = async (req, res, next) => {
  const { id } = req.user;
  const { tripRequestId } = req.params;
  const userObj = {
    where: {
      id,
      roleId: 6,
    }
  };
  const tripObj = {
    where: {
      id: tripRequestId,
      userId: id,
    }
  };
  const isManager = await CommonQueries.findOne(users, userObj);

  const isRequester = await CommonQueries.findOne(tripRequests, tripObj);

  if (isManager || isRequester) {
    return next();
  }
  return Response.errorMessage(req, res, 'You should be either a requester or a manager', 403);
};
export const tripAccess = async (req, res, next) => {
  const { id } = req.user;
  const { tripRequestId } = req.params;
  const userObj = {
    where: { id: tripRequestId, userId: id },
  };
  const tripObj = {
    where: {
      id: tripRequestId,
    },
    include: [{
      model: users,
      include: [{ model: userProfile, where: { managerId: id, } }]
    }]
  };
  const tripUser = await CommonQueries.findOne(tripRequests, userObj);
  const isManager = await CommonQueries.findOne(tripRequests, tripObj);
  if (tripUser || isManager) {
    return next();
  }
  return Response.errorMessage(req, res, 'You should be either a requester or a manager', 403);
};
export const isManagerHasAccess = async (req, res, next) => {
  const getRole = await users.findAll({ where: { roleId: req.user.roleId }, raw: true });
  const [{ roleId }] = getRole;
  return roleId !== 6
    ? Response.errorMessage(req, res, 'You do not have access to perform this action as a manager', 403) : next();
};

export const isManagerOwnsRequest = async (req, res, next) => {
  const { id } = req.user;
  const { tripRequestId } = req.params;
  const AllUsers = await userProfile.findAll({
    where: { managerId: id },
    raw: true
  });
  const allUserId = AllUsers.map(i => i.userId);
  const findRequest = await tripRequests.findOne({
    where: { userId: allUserId, id: tripRequestId }, raw: true
  });
  return !findRequest ? Response.errorMessage(req, res, 'this request does not belongs to this manager', 403) : next();
};

export const isCommentOwner = async (req, res, next) => {
  const { id } = req.user;
  const queryObject = {
    where: { userId: id }

  };
  const oneComment = await CommonQueries.findOne(comments, queryObject);
  if (!oneComment) {
    return Response.errorMessage(req, res, 'Ooops! You cannot delete this comment. You are not the owner', 403);
  }
  return next();
};


export const CommentExists = async (req, res, next) => {
  const { commentId } = req.params;
  const queryObject = {
    where: { id: commentId }

  };
  const oneComment = await CommonQueries.findOne(comments, queryObject);
  if (!oneComment) {
    return Response.errorMessage(req, res, 'Ooops! Comment does\'nt exist', 404);
  }
  return next();
};

export default findOneUser;
