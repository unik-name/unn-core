select id, owner_id, key, value
from (
    select *
    from nfts
    $(wheres:raw)
    limit ${limit} offset ${offset}
) as tmp_nfts
join (
	select *
	from nftproperties
	where key in (${properties:list})
) as props
on tmp_nfts.id = props.nft_id;
