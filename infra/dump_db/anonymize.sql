UPDATE public."User"
SET
	"remoteId" = -42,
	"username" = 'user_' || id,
	"profilePictureUrl" = 'https://avatar.iran.liara.run/public',
	"profilePictureId" = NULL,
WHERE "remoteId" NOT IN (94560);
