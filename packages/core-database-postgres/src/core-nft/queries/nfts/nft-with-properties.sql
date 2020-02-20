select id, owner_id, key, value
from nfts
join (
	select *
	from nftproperties
	where key in (${properties:list})
) as props
on nfts.id = props.nft_id
$(wheres:raw)
limit ${limit} offset ${offset};
